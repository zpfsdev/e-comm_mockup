import { NextResponse, type NextRequest } from 'next/server';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : 'http://localhost:3001';

const PROTECTED_ROUTES = ['/cart', '/checkout', '/orders', '/profile', '/seller', '/admin'] as const;
const AUTH_ROUTES = ['/auth/sign-in', '/auth/sign-up'] as const;

function buildCsp(nonce: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  // Next.js automatically picks up the nonce from the request CSP header
  // and injects it into the inline scripts it generates.
  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`;

  return [
    "default-src 'self'",
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: https:",
    "font-src 'self'",
    `connect-src 'self' ${API_ORIGIN}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

function setSecurityHeaders(response: NextResponse, csp: string): void {
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
  }
}

/**
 * Single request handler (Next.js 16 proxy). Sets CSP + security headers on every
 * request and performs route guards for protected/auth routes using the session cookie.
 * Real auth is enforced server-side via requireAuth() in layouts; this is a fast client redirect.
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const { pathname } = request.nextUrl;
  // Use HttpOnly access-token cookie; we no longer set a JS-writable "session" cookie.
  const hasAuth = request.cookies.has('at');
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtectedRoute && !hasAuth) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('from', request.nextUrl.pathname + request.nextUrl.search);
    const res = NextResponse.redirect(signInUrl);
    setSecurityHeaders(res, csp);
    return res;
  }

  if (isAuthRoute && hasAuth) {
    const res = NextResponse.redirect(new URL('/', request.url));
    setSecurityHeaders(res, csp);
    return res;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  setSecurityHeaders(response, csp);
  return response;
}


export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
