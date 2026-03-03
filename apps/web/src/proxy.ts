import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/cart', '/checkout', '/orders', '/profile', '/seller', '/admin'] as const;
const AUTH_ROUTES = ['/auth/sign-in', '/auth/sign-up'] as const;

/**
 * Route guard proxy.
 * Uses a lightweight `session` cookie (set client-side at sign-in alongside
 * localStorage) as a signal — the real auth validation happens at the API level.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('session');

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !hasSession) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('from', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/cart/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/seller/:path*',
    '/admin/:path*',
    '/auth/:path*',
  ],
};

