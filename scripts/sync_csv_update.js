const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase URL or Key di .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_FILE_PATH = path.join(__dirname, '../../Final Data RK(AutoRecovered).csv');

/**
 * Parsing string sosmed menjadi field-field terpisah.
 * Format contoh: "Instagram: https://instagram.com/username"
 */
function parseSosmed(sosmedString) {
  let sosmed_linkedin = '';
  let sosmed_ig = '';
  let sosmed_fb = '';
  let sosmed_tiktok = '';

  if (!sosmedString) return { sosmed_linkedin, sosmed_ig, sosmed_fb, sosmed_tiktok };

  const lowerStr = sosmedString.toLowerCase();

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
  console.log('Memulai sinkronisasi data dari CSV terbaru ke Supabase...');
  console.log('Catatan: Hanya data yang ada di CSV yang akan di-upsert. Data lain di Supabase tidak disentuh.\n');

  // Baca dan parse CSV
  console.log(`Membaca file: ${CSV_FILE_PATH}`);
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error('File CSV tidak ditemukan!');
    process.exit(1);
  }

  const csvData = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const lines = csvData.split('\n');

  console.log(`Total baris di CSV (termasuk header): ${lines.length}`);

  // Kolom CSV:
  // 0: Nama, 1: NIM, 2: Tahun Masuk, 3: Tanggal Lulus, 4: Fakultas, 5: Program Studi
  // 6: Sosmed, 7: Email, 8: No Hp, 9: Tempat Bekerja, 10: Alamat Bekerja
  // 11: Posisi, 12: Kategori/Jenis Pekerjaan, 13: Sosmed Tempat Bekerja

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(';');

    const nama = cols[0] || '';
    if (!nama) continue;

    const nim = cols[1] || '';
    const tahun_masuk = cols[2] || '';
    const tanggal_lulus = cols[3] || '';
    const fakultas = cols[4] || '';
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
      tanggal_lulus,
      fakultas,
      program_studi,
      email,
      no_hp,
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
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`Total ${records.length} record dari CSV (sebelum deduplikasi).`);

  // Deduplikasi berdasarkan NIM — jika NIM sama muncul berkali-kali di CSV,
  // ambil yang terakhir (row paling bawah di CSV dianggap paling update).
  // Record tanpa NIM dipisah karena tidak bisa di-upsert dengan onConflict: 'nim'.
  const nimMap = new Map();
  const noNimRecords = [];

  for (const record of records) {
    if (record.nim) {
      nimMap.set(record.nim, record); // overwrite kalau duplikat, ambil yang terakhir
    } else {
      noNimRecords.push(record);
    }
  }

  const uniqueRecords = Array.from(nimMap.values());
  console.log(`Setelah deduplikasi: ${uniqueRecords.length} record unik (NIM ada) + ${noNimRecords.length} record tanpa NIM.\n`);

  if (uniqueRecords.length === 0 && noNimRecords.length === 0) {
    console.log('Tidak ada data yang diproses.');
    return;
  }

  const BATCH_SIZE = 500;
  let successCount = 0;
  let errorCount = 0;

  // --- Upsert record yang punya NIM ---
  if (uniqueRecords.length > 0) {
    console.log(`Memproses ${Math.ceil(uniqueRecords.length / BATCH_SIZE)} batch upsert (record ber-NIM)...`);

    for (let i = 0; i < uniqueRecords.length; i += BATCH_SIZE) {
      const batch = uniqueRecords.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatch = Math.ceil(uniqueRecords.length / BATCH_SIZE);

      const { error } = await supabase
        .from('alumni')
        .upsert(batch, {
          onConflict: 'nim',       // update jika NIM sudah ada, insert jika belum
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`[Batch ${batchNum}/${totalBatch}] GAGAL: ${error.message}`);
        errorCount += batch.length;
      } else {
        console.log(`[Batch ${batchNum}/${totalBatch}] OK — baris ${i + 1} s/d ${Math.min(i + BATCH_SIZE, uniqueRecords.length)}`);
        successCount += batch.length;
      }
    }
  }

  // --- Insert record tanpa NIM (tidak bisa pakai onConflict) ---
  if (noNimRecords.length > 0) {
    console.log(`\nMemproses ${Math.ceil(noNimRecords.length / BATCH_SIZE)} batch insert (record tanpa NIM)...`);

    for (let i = 0; i < noNimRecords.length; i += BATCH_SIZE) {
      const batch = noNimRecords.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatch = Math.ceil(noNimRecords.length / BATCH_SIZE);

      const { error } = await supabase.from('alumni').insert(batch);

      if (error) {
        console.error(`[No-NIM Batch ${batchNum}/${totalBatch}] GAGAL: ${error.message}`);
        errorCount += batch.length;
      } else {
        console.log(`[No-NIM Batch ${batchNum}/${totalBatch}] OK`);
        successCount += batch.length;
      }
    }
  }

  console.log('\n=== Sinkronisasi selesai ===');
  console.log(`Berhasil  : ${successCount} record`);
  if (errorCount > 0) console.log(`Gagal     : ${errorCount} record`);
  console.log('Data yang tidak ada di CSV tetap aman di Supabase.');
}

run();
