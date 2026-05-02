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

const CSV_FILE_PATH = path.join(__dirname, '../../Final Data RK(AutoRecovered).csv');

function parseSosmed(sosmedString) {
  let sosmed_linkedin = '';
  let sosmed_ig = '';
  let sosmed_fb = '';
  let sosmed_tiktok = '';

  if (!sosmedString) return { sosmed_linkedin, sosmed_ig, sosmed_fb, sosmed_tiktok };

  const lowerStr = sosmedString.toLowerCase();
  
  // Example "Instagram: https://... "
  const parts = sosmedString.split(';').map(s => s.trim()).filter(Boolean);
  
  // In the CSV, multiple sosmed might be comma separated or single.
  // Wait, the CSV uses ';' as delimiter, so if sosmed has ';', it's already split by CSV column,
  // but looking at the header, 'Sosmed' is just one column, e.g. "Instagram: https://instagram.com/caturrahmanioktavia"
  if (lowerStr.includes('linkedin')) sosmed_linkedin = getUrl(sosmedString);
  if (lowerStr.includes('instagram')) sosmed_ig = getUrl(sosmedString);
  if (lowerStr.includes('facebook')) sosmed_fb = getUrl(sosmedString);
  if (lowerStr.includes('tiktok')) sosmed_tiktok = getUrl(sosmedString);

  return { sosmed_linkedin, sosmed_ig, sosmed_fb, sosmed_tiktok };
}

function getUrl(str) {
  const match = str.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : str.replace(/^[a-zA-Z]+:\s*/, '');
}

async function run() {
  console.log("Memulai proses migrasi data...");
  console.log("Mengambil data existing dari database untuk mencegah duplikasi...");
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
  
  const headers = lines[0].split(';');
  
  let records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = line.split(';');
    
    // As observed in the data:
    // 0: Nama, 1: NIM, 2: Tahun Masuk, 3: Tanggal Lulus, 4: Fakultas, 5: Program Studi
    // 6: Sosmed, 7: Email, 8: No Hp, 9: Tempat Bekerja, 10: Alamat Bekerja
    // 11: Posisi, 12: Kategori, 13: Sosmed_Tempat_Bekerja
    
    const nama = cols[0] || '';
    if (!nama) continue; // Skip empty rows
    
    const nim = cols[1] || '';
    
    // Pengecekan Duplikasi
    const key = nim ? nim : nama;
    if (existingKeys.has(key)) {
      continue; // Skip data yang sudah ada di database
    }
    const tahun_masuk = cols[2] || '';
    const program_studi = cols[5] || '';
    const sosmedStr = cols[6] || '';
    const email = cols[7] || '';
    const no_hp = cols[8] || '';
    const tempat_bekerja = cols[9] || '';
    const alamat_bekerja = cols[10] || '';
    const posisi = cols[11] || '';
    const jenis_pekerjaan = cols[12] || '';
    const sosmed_tempat_bekerja = cols[13] || '';
    
    const { sosmed_linkedin, sosmed_ig, sosmed_fb, sosmed_tiktok } = parseSosmed(sosmedStr);
    
    records.push({
      nama,
      nim,
      tahun_masuk,
      program_studi,
      email,
      no_hp: no_hp,
      tempat_bekerja,
      alamat_bekerja,
      posisi,
      jabatan: posisi,
      instansi: tempat_bekerja,
      jenis_pekerjaan,
      sosmed_tempat_bekerja,
      sosmed_linkedin,
      sosmed_ig,
      sosmed_fb,
      sosmed_tiktok,
      status: 'Teridentifikasi',
      confidence: 1.0,
      sources: ['Database Excel (Lengkap)'],
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
      // continue instead of breaking to ensure as much data uploaded as possible
    } else {
      console.log(`Berhasil mengunggah baris ${i} sampai ${Math.min(i + BATCH_SIZE, records.length)}`);
    }
  }

  console.log("Migrasi data selesai!");
}

run();
