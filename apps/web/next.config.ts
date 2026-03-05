import type { NextConfig } from 'next';
import path from 'path';

/**
 * Content Security Policy header value.
 *
 * Rules:
 * - default-src 'self'      — only load same-origin by default
 * - script-src              — allows Next.js inline scripts + Google Fonts
 * - style-src               — allows inline styles (CSS Modules inject <style>) + Google Fonts
 * - img-src                 — same-origin, data URIs, and HTTPS (product images from CDN)
 * - font-src                — Google Fonts + CDN used for the Softers brand font
 * - connect-src             — same-origin + API server
 * - frame-ancestors 'none'  — equivalent to X-Frame-Options: DENY (clickjacking)
 * - object-src 'none'       — disallows plugins (Flash, etc.)
 * - base-uri 'self'         — prevents base-tag injection
 * - upgrade-insecure-requests — forces HTTPS sub-resources in production
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiOrigin = apiUrl ? new URL(apiUrl).origin : 'http://localhost:3001';

// unsafe-eval is only required by Next.js in development (HMR, eval source maps).
// Production builds do not need it and including it defeats CSP's XSS protection.
const scriptSrc = process.env.NODE_ENV === 'production'
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const CSP = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://db.onlinewebfonts.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com https://db.onlinewebfonts.com",
  `connect-src 'self' ${apiOrigin}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join('; ');

/** HTTP response headers applied to every page and API route. */
const SECURITY_HEADERS = [
  // ── Clickjacking ─────────────────────────────────────────────────────────
  { key: 'X-Frame-Options',           value: 'DENY' },

  // ── MIME sniffing ─────────────────────────────────────────────────────────
  { key: 'X-Content-Type-Options',    value: 'nosniff' },

  // ── XSS auditor (legacy browsers) ────────────────────────────────────────
  { key: 'X-XSS-Protection',         value: '1; mode=block' },

  // ── Referrer leakage ─────────────────────────────────────────────────────
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },

  // ── Permissions policy — restrict sensor/camera/mic access ───────────────
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },

  // ── HSTS — enforce HTTPS for 1 year with subdomain coverage ──────────────
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },

  // ── Content Security Policy ───────────────────────────────────────────────
  { key: 'Content-Security-Policy',  value: CSP },
];

const nextConfig: NextConfig = {
  // ── Turbopack ─────────────────────────────────────────────────────────────
  // Explicitly set the monorepo root so Next.js does not try to infer it from
  // the presence of multiple lockfiles.
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },

  // ── Image optimization ────────────────────────────────────────────────────
  images: {
    // Product images served from external storage (CDN / object storage).
    // In production, set NEXT_PUBLIC_IMAGE_HOSTNAMES to a comma-separated list
    // of allowed CDN hostnames (e.g. "assets.example.com,cdn.example.com").
    // Leaving it unset in production falls back to wildcard (dev convenience only).
    remotePatterns: (() => {
      const configured = (process.env.NEXT_PUBLIC_IMAGE_HOSTNAMES ?? '')
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);
      if (process.env.NODE_ENV === 'production' && configured.length > 0) {
        return configured.map((hostname) => ({
          protocol: 'https' as const,
          hostname,
        }));
      }
      return [{ protocol: 'https' as const, hostname: '**' }];
    })(),
    formats: ['image/avif', 'image/webp'],
    // Largest image size displayed in the product grid.
    deviceSizes: [480, 768, 1024, 1280, 1440],
    imageSizes: [64, 128, 256, 384],
    // Aggressive cache: 30-day TTL in the Next.js image cache.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // ── Compiler ─────────────────────────────────────────────────────────────
  compiler: {
    // Remove console.log in production; keep warn/error.
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // ── PoweredBy header ─────────────────────────────────────────────────────
  // Suppresses "X-Powered-By: Next.js" — minor fingerprinting reduction.
  poweredByHeader: false,

  // ── HTTP response headers ─────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all routes.
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
      {
        // Long-lived cache for immutable static assets (JS/CSS chunks).
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Revalidate HTML pages every 60 seconds via stale-while-revalidate.
        source: '/((?!_next/static).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ];
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Legacy path compatibility.
      {
        source: '/auth/signin',
        destination: '/auth/sign-in',
        permanent: true,
      },
      {
        source: '/auth/register',
        destination: '/auth/sign-up',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
