/**
 * API Performance Benchmarks
 *
 * These tests make real HTTP requests to a running API instance and assert
 * response-time budgets derived from the project SRS NFRs and modern web standards.
 *
 * SRS NFR §5.1:
 *   - Page loads within 3 000 ms
 *
 * Modern web standard targets applied here:
 *   - Public read endpoints (browse/search): p95 ≤ 500 ms
 *   - Single-record lookup:                  p95 ≤ 300 ms
 *   - Auth endpoints (write):                p95 ≤ 800 ms
 *
 * Prerequisites:
 *   1. Docker MySQL is running (`docker compose up -d`)
 *   2. API is running on port 3001 (`pnpm dev` or `pnpm start:prod`)
 *
 * Run: API_URL=http://localhost:3001 pnpm test:perf
 *      (add "test:perf": "jest --testPathPattern=performance" to package.json)
 */

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

/** Performs `count` sequential requests and returns the sorted latencies in ms. */
async function measureLatencies(url: string, count = 10): Promise<number[]> {
  const latencies: number[] = [];

  for (let i = 0; i < count; i++) {
    const start = performance.now();
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const end = performance.now();
    await response.json();
    latencies.push(end - start);
  }

  return latencies.sort((a, b) => a - b);
}

function percentile(sortedLatencies: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sortedLatencies.length) - 1;
  return sortedLatencies[Math.max(0, idx)];
}

// ── Product browsing ─────────────────────────────────────────────────────────

describe('GET /api/v1/products', () => {
  let sortedLatencies: number[];

  beforeAll(async () => {
    sortedLatencies = await measureLatencies(`${API_BASE}/api/v1/products?limit=20`, 15);
  }, 60_000);

  it('p50 (median) response time is under 300 ms', () => {
    const p50 = percentile(sortedLatencies, 50);
    expect(p50).toBeLessThan(300);
  });

  it('p95 response time is under 500 ms (modern standard)', () => {
    const p95 = percentile(sortedLatencies, 95);
    expect(p95).toBeLessThan(500);
  });

  it('p99 response time is under 3 000 ms (SRS NFR)', () => {
    const p99 = percentile(sortedLatencies, 99);
    expect(p99).toBeLessThan(3_000);
  });

  it('returns HTTP 200', async () => {
    const response = await fetch(`${API_BASE}/api/v1/products`);
    expect(response.status).toBe(200);
  });
});

// ── Product search (text filter) ──────────────────────────────────────────────

describe('GET /api/v1/products?search=book', () => {
  let sortedLatencies: number[];

  beforeAll(async () => {
    sortedLatencies = await measureLatencies(
      `${API_BASE}/api/v1/products?search=book&limit=20`,
      10,
    );
  }, 30_000);

  it('p95 response time is under 800 ms with active search filter', () => {
    const p95 = percentile(sortedLatencies, 95);
    expect(p95).toBeLessThan(800);
  });
});

// ── Category lookup ──────────────────────────────────────────────────────────

describe('GET /api/v1/categories', () => {
  let sortedLatencies: number[];

  beforeAll(async () => {
    sortedLatencies = await measureLatencies(`${API_BASE}/api/v1/categories`, 10);
  }, 30_000);

  it('p95 response time is under 200 ms (reference data, expected fast)', () => {
    const p95 = percentile(sortedLatencies, 95);
    expect(p95).toBeLessThan(200);
  });
});

// ── Sellers list ─────────────────────────────────────────────────────────────

describe('GET /api/v1/sellers', () => {
  let sortedLatencies: number[];

  beforeAll(async () => {
    sortedLatencies = await measureLatencies(`${API_BASE}/api/v1/sellers`, 10);
  }, 30_000);

  it('p95 response time is under 500 ms', () => {
    const p95 = percentile(sortedLatencies, 95);
    expect(p95).toBeLessThan(500);
  });
});

// ── Security headers ─────────────────────────────────────────────────────────

describe('Security headers on public endpoints', () => {
  let headers: Headers;

  beforeAll(async () => {
    const response = await fetch(`${API_BASE}/api/v1/products`);
    headers = response.headers;
  }, 15_000);

  it('sets X-Content-Type-Options: nosniff', () => {
    expect(headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('sets X-Frame-Options (deny clickjacking)', () => {
    const xfo = headers.get('x-frame-options');
    expect(xfo).toBeTruthy();
  });

  it('sets Strict-Transport-Security', () => {
    expect(headers.get('strict-transport-security')).toBeTruthy();
  });

  it('does not expose X-Powered-By', () => {
    expect(headers.get('x-powered-by')).toBeNull();
  });

  it('sets Content-Security-Policy', () => {
    expect(headers.get('content-security-policy')).toBeTruthy();
  });
});

describe('Security headers on authenticated endpoints', () => {
  let headers: Headers;

  beforeAll(async () => {
    // Use an authenticated admin stats endpoint as representative
    const loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'P@ssw0rd123',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Failed to login for header test: ${loginRes.status}`);
    }

    const { accessToken } = (await loginRes.json()) as { accessToken: string };
    const statsRes = await fetch(`${API_BASE}/api/v1/admin/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    headers = statsRes.headers;
  }, 20_000);

  it('sets X-Content-Type-Options: nosniff', () => {
    expect(headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('sets X-Frame-Options (deny clickjacking)', () => {
    const xfo = headers.get('x-frame-options');
    expect(xfo).toBeTruthy();
  });

  it('sets Strict-Transport-Security', () => {
    expect(headers.get('strict-transport-security')).toBeTruthy();
  });

  it('does not expose X-Powered-By', () => {
    expect(headers.get('x-powered-by')).toBeNull();
  });

  it('sets Content-Security-Policy', () => {
    expect(headers.get('content-security-policy')).toBeTruthy();
  });
});

// ── Auth rate limiting ────────────────────────────────────────────────────────

describe('Rate limiting on auth endpoints', () => {
  it('returns 429 after exceeding the auth throttle limit', async () => {
    const loginUrl = `${API_BASE}/api/v1/auth/login`;
    const payload = JSON.stringify({ email: 'x@x.com', password: 'wrong' });
    const opts: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    };

    let lastStatus = 0;
    // Fire 12 requests — auth limit is 10/min, so at least one should 429.
    for (let i = 0; i < 12; i++) {
      const res = await fetch(loginUrl, opts);
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
  }, 20_000);
});
