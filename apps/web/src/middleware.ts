import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages a session-holder should be bounced away from. Excludes /verify-otp and
// /reset-password since a freshly registered (unverified) user already has a
// session cookie but still needs to reach those pages.
const AUTH_PAGES = ['/login', '/register'];
const PROTECTED_PREFIXES = ['/account', '/orders', '/checkout'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get('access_token'));

  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-otp',
    '/account/:path*',
    '/orders/:path*',
    '/checkout/:path*',
  ],
};
