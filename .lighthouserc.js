/**
 * Lighthouse CI configuration — Artistryx
 *
 * Targets modern Core Web Vitals thresholds (2024 standards):
 *   LCP  (Largest Contentful Paint)  < 2.5 s  → "Good"
 *   INP  (Interaction to Next Paint) < 200 ms → "Good"
 *   CLS  (Cumulative Layout Shift)   < 0.1    → "Good"
 *   FCP  (First Contentful Paint)    < 1.8 s  → "Good"
 *   TTFB (Time to First Byte)        < 800 ms → "Good"
 *   TBT  (Total Blocking Time)       < 200 ms → proxy for INP in lab tests
 *
 * SRS NFR covered: page load within 3 s → enforced via LCP + FCP thresholds above.
 *
 * Run locally:
 *   npx @lhci/cli autorun
 *
 * CI (GitHub Actions / any CI):
 *   pnpm exec lhci autorun
 */

module.exports = {
  ci: {
    collect: {
      // Audit the three most performance-critical public pages.
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/products',
        'http://localhost:3000/auth/sign-in',
      ],
      numberOfRuns: 3,
      // Ensures the app server is running before Lighthouse attempts to collect.
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30_000,
    },

    assert: {
      assertions: {
        // ── Core Web Vitals ─────────────────────────────────────────────────
        'categories:performance': ['error', { minScore: 0.8 }],

        // LCP < 2 500 ms
        'audits[largest-contentful-paint].numericValue': ['error', { maxNumericValue: 2_500 }],

        // FCP < 1 800 ms
        'audits[first-contentful-paint].numericValue': ['error', { maxNumericValue: 1_800 }],

        // TBT < 200 ms (lab proxy for INP)
        'audits[total-blocking-time].numericValue': ['error', { maxNumericValue: 200 }],

        // CLS < 0.10
        'audits[cumulative-layout-shift].numericValue': ['error', { maxNumericValue: 0.10 }],

        // Speed Index < 3 400 ms
        'audits[speed-index].numericValue': ['error', { maxNumericValue: 3_400 }],

        // ── Accessibility ────────────────────────────────────────────────────
        'categories:accessibility': ['warn', { minScore: 0.9 }],

        // ── SEO ──────────────────────────────────────────────────────────────
        'categories:seo': ['warn', { minScore: 0.9 }],

        // ── Best practices ───────────────────────────────────────────────────
        'categories:best-practices': ['warn', { minScore: 0.9 }],

        // ── Security-related audits ──────────────────────────────────────────
        // Ensures HTTPS is used (enforced by HSTS header in production).
        'audits[is-on-https].score': ['warn', { minScore: 1 }],

        // Detects mixed content.
        'audits[no-vulnerable-libraries].score': ['warn', { minScore: 1 }],

        // Ensure Content-Security-Policy is present.
        'audits[csp-xss].score': ['warn', { minScore: 1 }],

        // ── Resource size budgets ────────────────────────────────────────────
        // First load JS should stay lean for mobile users.
        'audits[uses-optimized-images].score': ['warn', { minScore: 1 }],
        'audits[uses-webp-images].score':      ['warn', { minScore: 1 }],
        'audits[uses-text-compression].score': ['error', { minScore: 1 }],
      },
    },

    upload: {
      // Use 'filesystem' locally; change to 'lhci' with a server URL in CI.
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
