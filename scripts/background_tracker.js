/**
 * Background Tracker - Pelacakan OSINT tanpa browser
 * 
 * Script ini berjalan mandiri di terminal, tidak butuh browser terbuka.
 * Progress disimpan per-alumni ke Supabase, jadi bisa di-stop (Ctrl+C) kapan saja
 * dan dilanjutkan lagi nanti.
 * 
 * Jalankan: node scripts/background_tracker.js
 * 
 * Opsi:
 *   --limit=500       Jumlah alumni per batch (default: 1000)
 *   --delay=1500      Jeda antar alumni dalam ms (default: 1200)
 *   --no-linkedin     Skip LinkedIn
 *   --no-github       Skip GitHub
 *   --no-tracer       Skip Tracer UMM
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Konfigurasi Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// URL aplikasi yang sudah di-deploy di Vercel
const APP_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://alumtrak.vercel.app';

// Parse argumen CLI
const args = process.argv.slice(2);
const getArg = (name) => {
  const found = args.find(a => a.startsWith(`--${name}=`));
  return found ? found.split('=')[1] : null;
};

const BATCH_LIMIT = parseInt(getArg('limit') || '1000');
const DELAY_MS = parseInt(getArg('delay') || '1200');
const USE_LINKEDIN = !args.includes('--no-linkedin');
const USE_GITHUB = !args.includes('--no-github');
const USE_TRACER = !args.includes('--no-tracer');

// Flag untuk graceful shutdown
let stopRequested = false;
process.on('SIGINT', () => {
  console.log('\n\n[STOP] Ctrl+C terdeteksi. Menyimpan progress dan berhenti...');
  stopRequested = true;
});

// Helper: fetch dengan timeout
async function fetchWithTimeout(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AlumniTraceOSINT/2.0-Background' },
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Sumber 1: GitHub REST API (langsung, tanpa lewat Vercel)
async function searchGitHub(nama) {
  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/search/users?q=${encodeURIComponent(nama)}+location:Indonesia`,
      10000
    );
    if (res.status === 429 || res.status === 403) return { blocked: true };
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const userRes = await fetchWithTimeout(data.items[0].url, 10000);
      const user = await userRes.json();
      return {
        success: true,
        data: {
          instansi: user.company || null,
          posisi: user.company ? 'Software Engineer / IT' : null,
          email: user.email || null,
          blog: user.blog || null,
          twitter: user.twitter_username ? `@${user.twitter_username}` : null,
          name: user.name || user.login
        }
      };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

// Sumber 2: LinkedIn via Vercel API route (memanfaatkan DuckDuckGo dorking di server)
async function searchLinkedIn(nama) {
  try {
    const res = await fetchWithTimeout(
      `${APP_URL}/api/osint-bot?target=${encodeURIComponent(nama)}`,
      55000
    );
    if (res.status === 429 || res.status === 403) return { blocked: true };
    const json = await res.json();
    if (json.error && (json.error.includes('captcha') || json.error.includes('blocked') || json.error.includes('rate'))) {
      return { blocked: true };
    }
    if (json.success && json.data) return { success: true, data: json.data };
    return { success: false, data: json.data };
  } catch {
    return { success: false };
  }
}

// Sumber 3: Tracer UMM via Vercel API route
async function searchTracerUMM(nama, nim) {
  if (!nim || nim.trim() === '') return { success: false };
  try {
    const res = await fetchWithTimeout(
      `${APP_URL}/api/osint-tracer-umm?target=${encodeURIComponent(nama)}&nim=${encodeURIComponent(nim)}`,
      30000
    );
    const json = await res.json();
    if (json.success && json.data) return { success: true, data: json.data };
    return { success: false };
  } catch {
    return { success: false };
  }
}

// Parse headline LinkedIn menjadi jabatan + perusahaan
function parseHeadline(headline) {
  const separators = [' at ', ' di ', ' - '];
  for (const sep of separators) {
    if (headline.toLowerCase().includes(sep.toLowerCase())) {
      const parts = headline.split(new RegExp(sep, 'i'));
      return { job: parts[0].trim(), company: parts.slice(1).join(sep).trim() };
    }
  }
  if (headline.includes(' | ')) {
    const parts = headline.split(' | ');
    return { job: parts[0].trim(), company: parts.slice(1).join(' | ').trim() };
  }
  return { job: headline, company: '' };
}

// Main loop
async function main() {
  console.log('==========================================================');
  console.log('  ALUMNI TRACKER - Background Mode (tanpa browser)');
  console.log('==========================================================');
  console.log(`  Vercel API    : ${APP_URL}`);
  console.log(`  Batch Limit   : ${BATCH_LIMIT}`);
  console.log(`  Delay         : ${DELAY_MS}ms`);
  console.log(`  LinkedIn      : ${USE_LINKEDIN ? 'ON' : 'OFF'}`);
  console.log(`  GitHub        : ${USE_GITHUB ? 'ON' : 'OFF'}`);
  console.log(`  Tracer UMM    : ${USE_TRACER ? 'ON' : 'OFF'}`);
  console.log('  Tekan Ctrl+C untuk berhenti (progress tersimpan otomatis)');
  console.log('==========================================================\n');

  // Ambil data alumni yang belum dilacak
  const { data: targets, error } = await supabase
    .from('alumni')
    .select('*')
    .eq('status', 'Belum Dilacak')
    .order('id', { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    console.error('[ERROR] Gagal ambil data dari Supabase:', error.message);
    return;
  }

  if (!targets || targets.length === 0) {
    console.log('[DONE] Tidak ada alumni dengan status "Belum Dilacak". Semua sudah diproses!');
    return;
  }

  console.log(`[INFO] Memproses ${targets.length} alumni...\n`);

  let found = 0, failed = 0;
  let consecutiveFails = 0;

  for (let i = 0; i < targets.length; i++) {
    if (stopRequested) {
      console.log(`\n[PAUSED] Dihentikan pada alumni ke-${i}/${targets.length}. Jalankan ulang untuk melanjutkan.`);
      break;
    }

    const t = targets[i];
    const nama = t.nama;
    const nim = t.nim || '';
    console.log(`[TRACK ${i + 1}/${targets.length}] ${nama} (NIM: ${nim || '-'})`);

    let osintData = null;
    let linkedinData = null;
    let tracerUmmData = null;
    let apiBlocked = false;

    // GitHub
    if (USE_GITHUB && !stopRequested) {
      const gh = await searchGitHub(nama);
      if (gh.blocked) {
        console.log('  [BLOCK] GitHub rate-limit. Auto-stop...');
        apiBlocked = true;
      } else if (gh.success) {
        osintData = gh.data;
        console.log(`  [OK] GitHub: ${osintData.name} - ${osintData.instansi || 'N/A'}`);
      }
    }

    // LinkedIn
    if (USE_LINKEDIN && !stopRequested && !apiBlocked) {
      let attempts = 0;
      let success = false;
      while (attempts < 2 && !success && !stopRequested) {
        attempts++;
        if (attempts > 1) {
          console.log(`  [RETRY] LinkedIn attempt ${attempts}...`);
          await new Promise(r => setTimeout(r, 1500));
        }
        const li = await searchLinkedIn(nama);
        if (li.blocked) {
          console.log('  [BLOCK] LinkedIn/DDG CAPTCHA. Auto-stop...');
          apiBlocked = true;
          break;
        } else if (li.success && li.data) {
          linkedinData = li.data;
          console.log(`  [OK] LinkedIn: ${linkedinData.headline || linkedinData.name || 'Found'}`);
          success = true;
        } else {
          console.log(`  [WARN] LinkedIn: Tidak cocok.`);
          success = true; // Jangan retry lagi kalau data kosong tapi tidak error
        }
      }
    }

    // Tracer UMM
    if (USE_TRACER && !stopRequested && !apiBlocked) {
      const tr = await searchTracerUMM(nama, nim);
      if (tr.success) {
        tracerUmmData = tr.data;
        console.log(`  [OK] Tracer UMM: email=${tracerUmmData.email || '-'}, hp=${tracerUmmData.no_hp || '-'}`);
      } else {
        console.log('  [WARN] Tracer UMM: Belum mengisi kuesioner');
      }
    }

    // Jika API terblokir, simpan dan stop
    if (apiBlocked) {
      console.log('\n[AUTO-STOP] API terblokir. Menyimpan dan berhenti...');
      await supabase.from('alumni').update({
        status: 'Belum Ditemukan', confidence: 0.05, updated_at: new Date().toISOString()
      }).eq('id', t.id);
      break;
    }

    // Evaluasi hasil dan simpan ke Supabase
    const updateData = { updated_at: new Date().toISOString() };

    if (osintData || linkedinData || tracerUmmData) {
      found++;
      consecutiveFails = 0;
      updateData.status = 'Teridentifikasi';
      updateData.confidence = 0.95;
      updateData.sources = [];

      // GitHub data
      if (osintData) {
        updateData.sources.push('Github API');
        updateData.email = osintData.email || null;
        updateData.tempat_bekerja = osintData.instansi || null;
        updateData.posisi = osintData.posisi || null;
        updateData.sosmed_linkedin = osintData.blog || null;
        updateData.sosmed_ig = osintData.twitter || null;
      }

      // LinkedIn data
      if (linkedinData) {
        updateData.sources.push('LinkedIn Bot');
        updateData.sosmed_linkedin = linkedinData.url || updateData.sosmed_linkedin || null;
        const company = linkedinData.company || '';
        const headline = linkedinData.headline || '';
        if (company) {
          updateData.tempat_bekerja = company;
          updateData.jabatan = headline || null;
          updateData.posisi = headline || null;
        } else if (headline) {
          const parsed = parseHeadline(headline);
          updateData.jabatan = parsed.job || null;
          updateData.posisi = parsed.job || null;
          updateData.tempat_bekerja = parsed.company || updateData.tempat_bekerja || null;
        }
        if (linkedinData.location) updateData.lokasi = linkedinData.location;
        if (linkedinData.physicalAddress) updateData.alamat_bekerja = linkedinData.physicalAddress;
        if (linkedinData.physicalWebsite) updateData.sosmed_tempat_bekerja = linkedinData.physicalWebsite;
      }

      // Tracer UMM data
      if (tracerUmmData) {
        updateData.sources.push('Tracer UMM (Internal)');
        updateData.tempat_bekerja = updateData.tempat_bekerja || tracerUmmData.instansi || null;
        updateData.posisi = updateData.posisi || tracerUmmData.jabatan || null;
        updateData.email = tracerUmmData.email || updateData.email || null;
        updateData.no_hp = tracerUmmData.no_hp || null;
      }

      console.log(`  => TERIDENTIFIKASI (95%)`);
    } else {
      failed++;
      consecutiveFails++;
      updateData.status = 'Belum Ditemukan';
      updateData.confidence = 0.1;
      console.log(`  => TIDAK DITEMUKAN`);
    }

    // Simpan ke Supabase
    const { error: updateErr } = await supabase.from('alumni').update(updateData).eq('id', t.id);
    if (updateErr) console.error(`  [DB ERROR] ${updateErr.message}`);

    // Auto-stop jika 5x gagal berturut-turut
    if (consecutiveFails >= 5) {
      console.log('\n[AUTO-STOP] 5x gagal berturut-turut. Kemungkinan semua API exhausted.');
      break;
    }

    // Jeda antar alumni
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log('\n==========================================================');
  console.log(`  SELESAI! Ditemukan: ${found} | Gagal: ${failed}`);
  console.log('  Jalankan ulang script ini untuk melanjutkan batch berikutnya.');
  console.log('==========================================================');
}

main().catch(console.error);
