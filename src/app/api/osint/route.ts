import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('q');

  if (!name) return NextResponse.json({ success: false });

  try {
    // Cari nama via Github REST API
    const res = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(name)}+location:Indonesia`, {
      method: "GET",
      headers: { "User-Agent": "AlumniTraceOSINT/2.0" }
    });

    const data = await res.json();
    if (data.items && data.items.length > 0) {
      // Dapatkan data detail dari hasil pertama
      const userRes = await fetch(data.items[0].url, {
        headers: { "User-Agent": "AlumniTraceOSINT/2.0" }
      });
      const user = await userRes.json();
      
      return NextResponse.json({
        success: true,
        data: {
          instansi: user.company || null,
          posisi: user.company ? 'Software Engineer / IT' : null,
          email: user.email || null,
          blog: user.blog || null,
          twitter: user.twitter_username ? `@${user.twitter_username}` : null,
          name: user.name || user.login
        }
      });
    }

    return NextResponse.json({ success: false, reason: "No public records" });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'OSINT Error' }, { status: 500 });
  }
}
