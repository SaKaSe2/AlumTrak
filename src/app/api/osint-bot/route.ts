import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Proxy ke Backend Render untuk LinkedIn scraping via Puppeteer Stealth
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target');

  if (!target) {
    return NextResponse.json({ success: false, error: 'Parameter target wajib diisi' });
  }

  // Delegasikan ke Render Backend yang punya Puppeteer Stealth
  try {
    const backendUrl = process.env.RENDER_BACKEND_URL || 'http://localhost:8000';
    const fetchUrl = `${backendUrl}/api/linkedin?target=${encodeURIComponent(target)}`;
    console.log(`[LinkedIn Proxy] Calling backend: ${fetchUrl}`);
    
    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000) // Turunkan dari 55s ke 20s agar tidak hang
    });
    
    const json = await res.json();
    if (json.success === false) {
      console.warn('[LinkedIn Proxy] Render Backend me-return false. Pindah ke Vercel Native Fallback...');
      // biarkan jatuh ke catch block atau throw
      throw new Error(json.error || 'Profil tidak ditemukan di backend');
    }
    return NextResponse.json(json);
  } catch (e: any) {
    console.warn('[LinkedIn Proxy] Gagal menyambung ke Render Backend:', e.message);
  }

  // Fallback: DuckDuckGo Dorking langsung dari Vercel (tanpa Puppeteer)
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    };

    // DDG index lebih kecil dari Google, pencarian tidak boleh terlalu ketat agari tidak 0 results.
    const query = `site:linkedin.com/in "${target}"`;
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    console.log('[LinkedIn Proxy] Fallback fetch DDG Native di URL:', ddgUrl);
    
    // Gunakan Vercel native fetch
    const searchRes = await fetch(ddgUrl, { headers, signal: AbortSignal.timeout(15000) });
    const searchHtml = await searchRes.text();

    // Parsing URL LinkedIn dari hasil DDG HTML
    const urlRegex = /https?:\/\/(?:id\.|www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_]+/gi;
    let allMatches: string[] = searchHtml.match(urlRegex) || [];
    
    const uddgRegex = /uddg=([^&"']+)/g;
    let uddgMatch;
    while ((uddgMatch = uddgRegex.exec(searchHtml)) !== null) {
      try {
        const decoded = decodeURIComponent(uddgMatch[1]);
        if (decoded.includes('linkedin.com/in/')) allMatches.push(decoded);
      } catch { /* skip */ }
    }

    const uniqueUrls = [...new Set(allMatches)].slice(0, 5);

    if (uniqueUrls.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ditemukan profil LinkedIn dari hasil pencarian.' });
    }

    // Kunjungi setiap profil dan ekstrak meta tags
    const candidates = [];
    const targetLower = target.toLowerCase();
    const targetWords = targetLower.split(/\s+/);

    for (const profileUrl of uniqueUrls) {
      try {
        const profileRes = await fetch(profileUrl, { headers, redirect: 'follow' });
        const profileHtml = await profileRes.text();

        let profileName = '';
        let headline = '';
        let description = '';

        const ogTitle = profileHtml.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
        if (ogTitle) {
          const parts = ogTitle[1].split(' - ');
          profileName = parts[0]?.trim() || '';
          if (parts.length > 1) headline = parts[1]?.split(' | ')[0]?.trim() || '';
        }

        const ogDesc = profileHtml.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
        if (ogDesc) description = ogDesc[1];

        if (!profileName) {
          const titleTag = profileHtml.match(/<title>([^<]+)<\/title>/);
          if (titleTag) {
            const parts = titleTag[1].split(' - ');
            profileName = parts[0]?.trim() || '';
            if (parts.length > 1) headline = parts[1]?.split(' | ')[0]?.trim() || '';
          }
        }

        const nameLower = profileName.toLowerCase();
        let matchScore = 0;
        for (const word of targetWords) {
          if (word.length >= 3 && nameLower.includes(word)) matchScore++;
        }
        const normalizedScore = targetWords.length > 0 ? matchScore / targetWords.length : 0;

        const descLower = description.toLowerCase();
        const hasUniHint = descLower.includes('muhammadiyah') || descLower.includes('umm') || descLower.includes('malang');

        candidates.push({
          url: profileUrl, name: profileName, headline,
          description: description.substring(0, 200),
          matchScore: normalizedScore, hasUniHint,
          verified: normalizedScore >= 0.6,
        });
      } catch { continue; }
    }

    if (candidates.length === 0) {
      return NextResponse.json({ success: false, error: 'Semua profil LinkedIn gagal diakses.' });
    }

    candidates.sort((a, b) => {
      if (a.hasUniHint && !b.hasUniHint) return -1;
      if (!a.hasUniHint && b.hasUniHint) return 1;
      return b.matchScore - a.matchScore;
    });

    const best = candidates[0];
    return NextResponse.json({
      success: best.verified,
      data: {
        url: best.url, name: best.name, headline: best.headline,
        description: best.description,
        matchScore: Math.round(best.matchScore * 100),
        hasUniHint: best.hasUniHint, totalChecked: candidates.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Bot gagal: ${message}` }, { status: 500 });
  }
}
