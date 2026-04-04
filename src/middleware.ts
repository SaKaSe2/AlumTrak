import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  
  // Periksa cookie auth
  const authCookie = request.cookies.get('alumni_auth');
  const isAuthenticated = authCookie?.value === 'valid_session';

  // Jika belum login dan bukan di halaman login atau public API, lempar ke /login
  if (!isAuthenticated && !isAuthPage && !request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/_next') && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah login dan mencoba ke halaman login, kembalikan ke dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};
