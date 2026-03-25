import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // NOTE: Do NOT set `output: 'standalone'` when deploying to Vercel.
  // Vercel handles Next.js bundling natively and `standalone` can conflict
  // with its serverless function splitting, leading to deployment errors.

  /* ── Turbopack ─────────────────────────────────────────────────────────────
  // Explicitly set the monorepo root so Next.js does not try to infer it from
  // the presence of multiple lockfiles.
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  }, */

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
      const localDevHostnames = ['localhost', '127.0.0.1'];
      const allowedHostnames =
        process.env.NODE_ENV === 'production'
          ? configured
          : [...new Set([...configured, ...localDevHostnames])];
      if (allowedHostnames.length === 0) {
        console.warn(
          '[Artistryx] NEXT_PUBLIC_IMAGE_HOSTNAMES is unset — external images will be blocked. ' +
          'Set it to a comma-separated list of allowed CDN hostnames (e.g. res.cloudinary.com) to enable.',
        );
        return [];
      }
      return allowedHostnames.map((hostname) => ({
        protocol: 'https' as const,
        hostname,
      }));
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
  // Security headers (CSP, X-Frame-Options, etc.) are set per-request in
  // src/middleware.ts so a unique nonce can be injected into each CSP.
  async headers() {
    return [
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
  // ── Rewrites (Direct-to-API proxying) ───────────────────────────────────────
  // Resolves Third-Party Cookie blocking by hosting the API under the same domain.
  async rewrites() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL
      ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
      : 'http://localhost:3001';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
