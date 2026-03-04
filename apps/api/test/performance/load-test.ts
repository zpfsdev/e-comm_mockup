/**
 * API Load Test — Artistryx
 *
 * Verifies the two NFR performance requirements from the SRS:
 *   1. Response time within 3 000 ms (p99 target: ≤ 1 500 ms, stretch: ≤ 500 ms)
 *   2. System handles ≥ 20 concurrent users without degradation
 *
 * Modern web standards targets applied on top:
 *   - TTFB (Time to First Byte): p99 < 800 ms
 *   - Error rate < 0.5%
 *   - Throughput: > 50 req/s under 20 connections
 *
 * Run: npx ts-node test/performance/load-test.ts
 * Or add "test:load" script to package.json.
 */

import autocannon from 'autocannon';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

interface SLATarget {
  readonly name: string;
  readonly p99MaxMs: number;
  readonly p50MaxMs: number;
  readonly maxErrorRatePercent: number;
  readonly minRps: number;
}

/** SRS baseline + stretch targets mapped to each test scenario. */
const SCENARIOS: Array<{
  label: string;
  url: string;
  connections: number;
  duration: number;
  sla: SLATarget;
}> = [
  {
    label: 'GET /products — public browse (20 concurrent users, SRS NFR)',
    url: `${API_BASE}/api/v1/products?limit=20`,
    connections: 20,
    duration: 30,
    sla: {
      name: 'SRS NFR',
      p99MaxMs: 3_000, // SRS requirement
      p50MaxMs: 800, // TTFB-equivalent target
      maxErrorRatePercent: 0.5,
      minRps: 50,
    },
  },
  {
    label: 'GET /products — stretch (20 concurrent, modern standard)',
    url: `${API_BASE}/api/v1/products?limit=20`,
    connections: 20,
    duration: 30,
    sla: {
      name: 'Modern standard',
      p99MaxMs: 1_500, // stretch: comfortable margin under 3 s
      p50MaxMs: 300, // stretch median
      maxErrorRatePercent: 0.1,
      minRps: 80,
    },
  },
  {
    label: 'GET /categories — lookup (20 concurrent)',
    url: `${API_BASE}/api/v1/categories`,
    connections: 20,
    duration: 15,
    sla: {
      name: 'Modern standard',
      p99MaxMs: 500,
      p50MaxMs: 100,
      maxErrorRatePercent: 0.1,
      minRps: 200,
    },
  },
  {
    label: 'GET /sellers — store directory (20 concurrent)',
    url: `${API_BASE}/api/v1/sellers`,
    connections: 20,
    duration: 15,
    sla: {
      name: 'Modern standard',
      p99MaxMs: 1_000,
      p50MaxMs: 200,
      maxErrorRatePercent: 0.1,
      minRps: 100,
    },
  },
];

interface ScenarioResult {
  label: string;
  passed: boolean;
  violations: string[];
  rps: number;
  p50: number;
  p99: number;
  errors: number;
  totalRequests: number;
  duration: number;
}

async function runScenario(
  scenario: (typeof SCENARIOS)[number],
): Promise<ScenarioResult> {
  return new Promise((resolve) => {
    const instance = autocannon({
      url: scenario.url,
      connections: scenario.connections,
      duration: scenario.duration,
      pipelining: 1,
      headers: { Accept: 'application/json' },
    });

    autocannon.track(instance, { renderProgressBar: true });

    instance.on('done', (result) => {
      const { sla } = scenario;
      const violations: string[] = [];

      const p50 = result.latency.p50;
      const p99 = result.latency.p99;
      const rps = result.requests.average;
      const totalRequests = result.requests.total;
      const errorRate =
        totalRequests > 0 ? (result.errors / totalRequests) * 100 : 0;

      if (p99 > sla.p99MaxMs)
        violations.push(`p99 latency ${p99}ms exceeds ${sla.p99MaxMs}ms`);
      if (p50 > sla.p50MaxMs)
        violations.push(`p50 latency ${p50}ms exceeds ${sla.p50MaxMs}ms`);
      if (errorRate > sla.maxErrorRatePercent)
        violations.push(
          `error rate ${errorRate.toFixed(2)}% exceeds ${sla.maxErrorRatePercent}%`,
        );
      if (rps < sla.minRps)
        violations.push(
          `throughput ${rps.toFixed(1)} req/s below ${sla.minRps} req/s`,
        );

      resolve({
        label: scenario.label,
        passed: violations.length === 0,
        violations,
        rps,
        p50,
        p99,
        errors: result.errors,
        totalRequests,
        duration: scenario.duration,
      });
    });
  });
}

function printResult(r: ScenarioResult): void {
  const status = r.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`\n${status}  ${r.label}`);
  console.log(`  Requests: ${r.totalRequests} total over ${r.duration}s`);
  console.log(`  Throughput: ${r.rps.toFixed(1)} req/s`);
  console.log(`  Latency  p50=${r.p50}ms  p99=${r.p99}ms`);
  console.log(`  Errors: ${r.errors}`);
  if (!r.passed) {
    r.violations.forEach((v) => console.log(`  ⚠ ${v}`));
  }
}

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Artistryx API — Load Test');
  console.log('  NFR: page load < 3 s, ≥ 20 concurrent users');
  console.log('  Stretch: TTFB p99 < 800 ms, error rate < 0.5%');
  console.log('═══════════════════════════════════════════════════\n');

  const results: ScenarioResult[] = [];

  for (const scenario of SCENARIOS) {
    console.log(`\nRunning: ${scenario.label}`);
    const result = await runScenario(scenario);
    results.push(result);
    printResult(result);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
