import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const validUsername = process.env.ADMIN_USERNAME || '';
  const validPassword = process.env.ADMIN_PASSWORD || '';

  if (username === validUsername && password === validPassword) {
    const response = NextResponse.json({ success: true });
    
    // Set cookie
    response.cookies.set({
      name: 'alumni_auth',
      value: 'valid_session',
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 minggu
    });
    
    return response;
  }

  return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
}
