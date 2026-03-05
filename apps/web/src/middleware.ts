import { NextResponse, type NextRequest } from 'next/server';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : 'http://localhost:3001';

/**
 * Generates a per-request CSP nonce and attaches it to the response headers.
 *
 * Why middleware instead of next.config.ts headers()?
 * Static header values cannot include a per-request nonce. By generating the
 * nonce here we can replace 'unsafe-inline' in script-src with 'nonce-<value>',
 * which prevents inline XSS while still allowing Next.js's own inline scripts
 * (hydration, router) to execute — Next.js forwards the nonce via its
 * built-in nonce support when you set the `x-nonce` request header.
 */
function buildCsp(nonce: string): string {
  const isProd = process.env.NODE_ENV === 'production';

  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}'`
    : `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`;

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://db.onlinewebfonts.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com https://db.onlinewebfonts.com",
    `connect-src 'self' ${API_ORIGIN}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join('; ');
}

export function middleware(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  // Forward nonce to Next.js so it can inject it into inline <script> tags.
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-csp', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set('Content-Security-Policy', csp);
  // Keep the rest of the security headers that were previously set in next.config.ts.
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

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except static assets and Next.js internals.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
