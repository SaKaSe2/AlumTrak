const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_FILE_PATH = path.join(__dirname, '../../Alumni 2000-2025.xlsx - Sheet1.csv');

async function run() {
  console.log("Memulai proses migrasi data dari Alumni 2000-2025...");
  console.log("Mengambil data existing dari database untuk mencegah duplikasi (ini mungkin memakan waktu)...");
  let existingKeys = new Set();
  let isFetching = true;
  let offset = 0;
  
  while(isFetching) {
    const { data: rows, error: fetchErr } = await supabase
      .from('alumni')
      .select('nim, nama')
      .range(offset, offset + 999);
      
    if (fetchErr) {
      console.error("Gagal mengambil data existing:", fetchErr);
      process.exit(1);
    }
    
    if (rows.length === 0) {
      break;
    }
    
    rows.forEach(r => {
      if (r.nim) existingKeys.add(r.nim);
      else if (r.nama) existingKeys.add(r.nama);
    });
    
    offset += 1000;
  }
  console.log(`Berhasil mengambil ${existingKeys.size} referensi data lama dari database.`);

  console.log("Membaca file CSV...");
  const csvData = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const lines = csvData.split('\n');
  
  let records = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Delimiter for this file is comma
    const cols = line.split(',');
    
    // Format: 0: Nama, 1: NIM, 2: Tahun Masuk, 3: Tanggal Lulus, 4: Fakultas, 5: Program Studi
    const nama = cols[0] || '';
    if (!nama || nama.toLowerCase() === 'nama') continue; // Skip empty rows or header
    
    const nim = cols[1] || '';
    
    // Pengecekan Duplikasi
    const key = nim ? nim : nama;
    if (existingKeys.has(key)) {
      continue; // Skip data yang sudah ada di database
    }
    
    const tahun_masuk = cols[2] || '';
    const program_studi = cols[5] || '';
    
    records.push({
      nama,
      nim,
      tahun_masuk,
      program_studi,
      status: 'Belum Teridentifikasi', // Set status karena belum ada data pekerjaan
      confidence: 1.0,
      sources: ['Alumni 2000-2025'],
      updated_at: new Date().toISOString()
    });
  }

  console.log(`Ditemukan ${records.length} data BARU untuk diunggah ke Supabase...`);
  if (records.length === 0) {
    console.log("Tidak ada data baru yang perlu ditambahkan. Semua sudah tersinkronisasi!");
    return;
  }

  const BATCH_SIZE = 500;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('alumni').insert(batch);
    if (error) {
      console.error(`Gagal mengunggah batch ${i} - ${i + BATCH_SIZE}:`, error);
      // Lanjut ke batch berikutnya agar sebanyak mungkin data terunggah
    } else {
      console.log(`Berhasil mengunggah baris ${i} sampai ${Math.min(i + BATCH_SIZE, records.length)}`);
    }
  }

  console.log("Migrasi data selesai!");
}

run();
