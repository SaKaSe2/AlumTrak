import { NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Proxy ke Render Backend untuk pencarian Facebook & Instagram
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target');
  const platform = searchParams.get('platform');

  if (!target || !platform) {
    return NextResponse.json({ success: false, error: 'Parameter target dan platform wajib diisi' });
  }

  try {
    const backendUrl = process.env.RENDER_BACKEND_URL || 'http://localhost:8000';
    const fetchUrl = `${backendUrl}/api/social-search?target=${encodeURIComponent(target)}&platform=${encodeURIComponent(platform)}`;
    console.log(`[Social Proxy] Calling backend: ${fetchUrl}`);

    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(25000)
    });

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    console.warn(`[Social Proxy] Gagal:`, e.message);
    return NextResponse.json({ success: false, error: e.message });
  }
}
