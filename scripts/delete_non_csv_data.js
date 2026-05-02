const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE = '../Alumni 2000-2025.xlsx - Sheet1.csv';

async function run() {
  console.log('Membaca NIM dari file CSV...');
  const csvNims = new Set();
  let rowCount = 0;

  const fileStream = fs.createReadStream(CSV_FILE);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;
  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    
    // Parse CSV line simply. Assuming NIM is the second column (index 1)
    const columns = line.split(',');
    if (columns.length >= 2) {
      const nim = columns[1].trim();
      if (nim) {
        csvNims.add(nim);
      }
    }
    rowCount++;
  }

  console.log(`Berhasil membaca ${rowCount} baris dari CSV. Unique NIMs: ${csvNims.size}`);

  console.log('Mengambil semua NIM dari database...');
  let allDbNims = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('alumni')
      .select('nim, id')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching database NIMs:', error);
      return;
    }

    if (data.length === 0) {
      hasMore = false;
    } else {
      allDbNims.push(...data);
      page++;
    }
  }

  console.log(`Total data di database: ${allDbNims.length}`);

  const idsToDelete = [];
  let nimsToDeleteCount = 0;

  for (const row of allDbNims) {
    if (!row.nim || !csvNims.has(row.nim.toString().trim())) {
      idsToDelete.push(row.id);
      nimsToDeleteCount++;
    }
  }

  console.log(`Ditemukan ${idsToDelete.length} data yang TIDAK ada di file CSV (akan dihapus).`);

  if (idsToDelete.length === 0) {
    console.log('Semua data di database sudah sesuai dengan file CSV.');
    return;
  }

  console.log('Mulai menghapus data...');
  const BATCH_SIZE = 500;
  let deletedCount = 0;

  for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
    const batch = idsToDelete.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('alumni')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`Gagal menghapus batch ${i} - ${i + batch.length}:`, error);
    } else {
      deletedCount += batch.length;
      console.log(`Berhasil menghapus ${deletedCount} / ${idsToDelete.length} data...`);
    }
  }

  console.log('Proses penghapusan selesai!');
  
  const { count } = await supabase.from('alumni').select('*', { count: 'exact', head: true });
  console.log(`Sisa total data di database sekarang: ${count}`);
}

run().catch(console.error);
