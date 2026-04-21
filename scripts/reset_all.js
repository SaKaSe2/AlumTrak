/**
 * Reset seluruh data alumni di Supabase ke status "Belum Dilacak"
 * Menghapus semua field dummy dari boost_rubric.js
 * 
 * Jalankan: node scripts/reset_all.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const RESET_DATA = {
  status: 'Belum Dilacak',
  confidence: null,
  jabatan: null,
  instansi: null,
  lokasi: null,
  sources: null,
  sosmed_linkedin: null,
  sosmed_fb: null,
  sosmed_ig: null,
  sosmed_tiktok: null,
  email: null,
  no_hp: null,
  posisi: null,
  tempat_bekerja: null,
  alamat_bekerja: null,
  sosmed_tempat_bekerja: null,
  jenis_pekerjaan: null,
  updated_at: null
};

async function main() {
  console.log('==========================================');
  console.log('  RESET SELURUH DATA KE "BELUM DILACAK"');
  console.log('==========================================\n');

  // Ambil total data
  const { count: totalAll } = await supabase
    .from('alumni')
    .select('*', { count: 'exact', head: true });

  console.log(`[INFO] Total data di database: ${totalAll?.toLocaleString()}`);

  // Reset per-batch menggunakan status yang perlu direset
  const statusList = ['Teridentifikasi', 'Perlu Verifikasi', 'Belum Ditemukan'];
  let totalProcessed = 0;

  for (const status of statusList) {
    const { count } = await supabase
      .from('alumni')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (!count || count === 0) {
      console.log(`[SKIP] Status "${status}": 0 data`);
      continue;
    }

    console.log(`[RESET] Status "${status}": ${count.toLocaleString()} data...`);

    let processed = 0;
    while (processed < count) {
      // Ambil batch ID
      const { data: batch } = await supabase
        .from('alumni')
        .select('id')
        .eq('status', status)
        .order('id', { ascending: true })
        .range(0, 999); // Selalu dari 0 karena data yang sudah direset berubah statusnya

      if (!batch || batch.length === 0) break;

      // Update per-record
      for (const row of batch) {
        await supabase.from('alumni').update(RESET_DATA).eq('id', row.id);
        processed++;
        totalProcessed++;
      }

      process.stdout.write(`\r  -> ${processed.toLocaleString()} / ${count.toLocaleString()} reset...`);
    }
    console.log(' OK');
  }

  console.log(`\n==========================================`);
  console.log(`  SELESAI! ${totalProcessed.toLocaleString()} data berhasil direset.`);
  console.log(`  Semua kembali ke "Belum Dilacak".`);
  console.log(`==========================================`);
}

main().catch(console.error);
