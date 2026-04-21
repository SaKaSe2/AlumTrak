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
  console.log('  MELANJUTKAN RESET DATA...');
  console.log('==========================================\n');

  let totalProcessed = 0;
  let remaining = -1;

  while (true) {
    // Ambil sisa data yang masih Teridentifikasi
    const { count } = await supabase
      .from('alumni')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'Belum Dilacak');

    remaining = count;

    if (remaining === 0) {
      break;
    }

    console.log(`\nSisa data yang perlu direset: ${remaining.toLocaleString()} data...`);

    // Ambil 1000 id
    const { data: batch, error } = await supabase
      .from('alumni')
      .select('id')
      .neq('status', 'Belum Dilacak')
      .order('id', { ascending: true })
      .range(0, 999);

    if (error) {
      console.error('[ERROR]', error);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    if (!batch || batch.length === 0) {
      console.log('Gagal ambil batch, retry dalam 2s...');
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    // Update batch secara paralel (dibatasi 100 concurrency agar tidak timeout)
    const chunkSize = 100;
    for (let i = 0; i < batch.length; i += chunkSize) {
      const chunk = batch.slice(i, i + chunkSize);
      const promises = chunk.map(row => 
        supabase.from('alumni').update(RESET_DATA).eq('id', row.id)
      );
      await Promise.all(promises);
      totalProcessed += chunk.length;
      process.stdout.write(`\r  -> Total direkap sesi ini: ${totalProcessed.toLocaleString()} reset...`);
    }
  }

  console.log(`\n==========================================`);
  console.log(`  SELESAI KESELURUHAN!`);
  console.log(`  Semua data sudah berstatus "Belum Dilacak".`);
  console.log(`==========================================`);
}

main().catch(console.error);
