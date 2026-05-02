const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dummyCompanies = [
  "PT Telkom Indonesia", "Bank Mandiri", "PT Astra International", "Gojek", "Tokopedia", 
  "Traveloka", "PT Pertamina", "Bank BCA", "Shopee Indonesia", "PT Unilever Indonesia",
  "PT Gudang Garam", "Kementerian Keuangan", "Kementerian Pendidikan", "Pemerintah Provinsi Jawa Timur",
  "PT Indofood", "Bank BNI", "Bank BRI", "PT PLN (Persero)", "Grab Indonesia"
];

const dummyPositions = [
  "Software Engineer", "Data Analyst", "Project Manager", "Marketing Specialist", 
  "HR Staff", "Financial Analyst", "Operations Manager", "Product Manager", 
  "Business Analyst", "Sales Executive", "Customer Service", "Graphic Designer",
  "Content Creator", "Quality Assurance", "Network Engineer", "Fullstack Developer"
];

const dummyKategori = [
  "Teknologi Informasi", "Keuangan dan Perbankan", "Pemerintahan", 
  "Pendidikan", "Kesehatan", "Industri Kreatif", "Manufaktur", "Retail"
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  console.log("Memulai proses update dummy data...");
  let isFetching = true;
  
  while(isFetching) {
    // Ambil 1000 id yang masih belum teridentifikasi
    const { data: rows, error: fetchErr } = await supabase
      .from('alumni')
      .select('id')
      .eq('status', 'Belum Teridentifikasi')
      .limit(1000);
      
    if (fetchErr) {
      console.error("Gagal mengambil data:", fetchErr);
      process.exit(1);
    }
    
    if (!rows || rows.length === 0) {
      break;
    }

    const ids = rows.map(r => r.id);
    
    const company = getRandomItem(dummyCompanies);
    const position = getRandomItem(dummyPositions);
    const kategori = getRandomItem(dummyKategori);
    
    console.log(`Meng-update batch berisi ${ids.length} data dengan pekerjaan: ${position} di ${company}...`);
    
    const { error: updateErr } = await supabase
      .from('alumni')
      .update({
        status: 'Teridentifikasi',
        tempat_bekerja: company,
        instansi: company,
        posisi: position,
        jabatan: position,
        jenis_pekerjaan: kategori,
        sources: ['Dummy Data'],
        updated_at: new Date().toISOString()
      })
      .in('id', ids);
    
    if (updateErr) {
      console.error("Gagal update batch:", updateErr);
      break;
    }
  }

  console.log("Selesai menggenerate data dummy!");
}

run();
