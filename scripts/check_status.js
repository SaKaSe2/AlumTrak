const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const statuses = ['Belum Dilacak', 'Teridentifikasi', 'Perlu Verifikasi', 'Belum Ditemukan'];
  for (const status of statuses) {
    const { count } = await supabase
      .from('alumni')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    console.log(`Status "${status}": ${count} data`);
  }
}
check();
