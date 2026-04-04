import { NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Header impersonasi browser untuk bypass deteksi bot/captcha ringan
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target');
  const nim = searchParams.get('nim');

  if (!target) {
    return NextResponse.json({ success: false, error: 'Parameter target wajib diisi' });
  }

  if (!nim || nim.trim() === '') {
    return NextResponse.json({ success: false, error: 'NIM tidak tersedia untuk scraping Tracer UMM' });
  }

  // LANGKAH 1: Direct HTTP scraping ke halaman form Tracer UMM
  // URL form bisa diakses langsung: /tracermhs3/form/{NIM}
  try {
    // Ambil cookie session dari halaman utama dulu (anti-bot measure)
    const mainPageRes = await fetch('https://simawa.umm.ac.id/tracermhs', {
      method: 'GET',
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    const cookies = mainPageRes.headers.get('set-cookie') || '';

    // Akses langsung halaman form detail alumni
    const formUrl = `https://simawa.umm.ac.id/tracermhs3/form/${nim.trim()}`;
    const formRes = await fetch(formUrl, {
      method: 'GET',
      headers: {
        ...BROWSER_HEADERS,
        'Cookie': cookies.split(',').map(c => c.split(';')[0].trim()).join('; '),
        'Referer': 'https://simawa.umm.ac.id/tracermhs',
      },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    });

    if (formRes.ok) {
      const html = await formRes.text();

      // Cek apakah halaman berisi data profil alumni (panel-body / form1)
      if (html.includes('panel-body') || html.includes('form1') || html.includes('form-horizontal')) {
        let email = '';
        let noHp = '';

        // Ekstrak email dari input: <input ... name="email" ... value="xxx@xxx">
        const emailFromInput = html.match(/name\s*=\s*["']email["'][^>]*value\s*=\s*["']([^"']+)/i)
          || html.match(/value\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']email["']/i);
        if (emailFromInput && emailFromInput[1].includes('@')) {
          email = emailFromInput[1].trim();
        }

        // Fallback: cari pola email dari teks HTML (setelah label "Email")
        if (!email) {
          const emailFromText = html.match(/Email[\s\S]{0,300}?([a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
          if (emailFromText) email = emailFromText[1].trim();
        }

        // Ekstrak No HP dari input: <input ... name="nohp/hp/wa" ... value="08xxx">
        const hpFromInput = html.match(/name\s*=\s*["'](?:nohp|no_hp|hp|wa|telp|phone|nohpwa|no_telp)["'][^>]*value\s*=\s*["']([^"']+)/i)
          || html.match(/value\s*=\s*["'](\d{10,15})["'][^>]*name\s*=\s*["'](?:nohp|hp|wa|telp)/i);
        if (hpFromInput && /\d{8,}/.test(hpFromInput[1])) {
          noHp = hpFromInput[1].trim();
        }

        // Fallback: cari pola nomor HP dari teks HTML (setelah label "HP/WA")
        if (!noHp) {
          const hpFromText = html.match(/(?:No\.\s*HP|HP\/WA|No\s*HP|No\.\s*Telp|WhatsApp)[\s\S]{0,300}?(0\d{9,13})/i);
          if (hpFromText) noHp = hpFromText[1].trim();
        }

        if (email || noHp) {
          console.log(`[Tracer UMM Direct] Berhasil scrape: email=${email}, hp=${noHp}`);
          return NextResponse.json({
            success: true,
            data: {
              nama: target,
              tahun_lulus: 2023,
              status_pekerjaan: 'Tervalidasi Simawa UMM',
              instansi: '',
              jabatan: '',
              email: email,
              no_hp: noHp,
              keselarasan_bidang: 'Tervalidasi Akun',
              sumber: 'Tracer UMM (Direct HTTP Scrape)'
            }
          });
        }
      }
    }
    console.warn(`[Tracer UMM Direct] Halaman form tidak mengandung data profil untuk NIM ${nim}`);
  } catch (e: any) {
    console.warn('[Tracer UMM Direct] Gagal fetch:', e.message);
  }

  // LANGKAH 2: Fallback ke Render Microservice (Puppeteer + Stealth Plugin anti-bot)
  try {
    const backendUrl = process.env.RENDER_BACKEND_URL || 'http://localhost:8000';
    const fetchUrl = `${backendUrl}/api/tracer?nim=${nim}&target=${encodeURIComponent(target)}`;
    
    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(29000)
    });
    
    const json = await res.json();
    if (json.success && json.data) {
      return NextResponse.json({ success: true, data: json.data });
    } else {
      console.warn('[Tracer UMM Render] Microservice error:', json.error);
    }
  } catch (e: any) {
    console.warn('[Tracer UMM Render] Gagal menyambung:', e.message);
  }

  // Semua metode gagal
  return NextResponse.json({ 
    success: false, 
    error: 'Subject belum mengisi form tracer di Simawa UMM.' 
  });
}
