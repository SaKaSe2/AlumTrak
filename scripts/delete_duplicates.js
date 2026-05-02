const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Mengambil semua data dari database untuk mencari duplikat NIM...');
  let allDbData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('alumni')
      .select('id, nim')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching database data:', error);
      return;
    }

    if (data.length === 0) {
      hasMore = false;
    } else {
      allDbData.push(...data);
      page++;
    }
  }

  console.log(`Total data di database: ${allDbData.length}`);

  const nimToId = new Map();
  const idsToDelete = [];

  for (const row of allDbData) {
    if (!row.nim) {
      // should already be deleted but just in case
      idsToDelete.push(row.id);
      continue;
    }
    const nimStr = row.nim.toString().trim();
    if (nimToId.has(nimStr)) {
      // Duplicate found, mark for deletion
      idsToDelete.push(row.id);
    } else {
      nimToId.set(nimStr, row.id);
    }
  }

  console.log(`Ditemukan ${idsToDelete.length} data duplikat yang akan dihapus.`);

  if (idsToDelete.length === 0) {
    console.log('Tidak ada data duplikat.');
    return;
  }

  console.log('Mulai menghapus data duplikat...');
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
      console.log(`Berhasil menghapus ${deletedCount} / ${idsToDelete.length} duplikat...`);
    }
  }

  console.log('Proses penghapusan selesai!');
  
  const { count } = await supabase.from('alumni').select('*', { count: 'exact', head: true });
  console.log(`Sisa total data di database sekarang: ${count}`);
}

run().catch(console.error);
