#!/usr/bin/env node
/**
 * secure-studio.js
 * ────────────────────────────────────────────────────────────────────────────
 * Wraps Prisma Studio in a lightweight Express proxy with Basic Auth.
 *
 * Environment variables:
 *   STUDIO_USER  – admin username (required)
 *   STUDIO_PASS  – admin password (required, use a strong random string)
 *   PORT         – public-facing port (default 4000, Render supplies this)
 *   DATABASE_URL – Prisma connection string (required by Prisma Studio)
 *
 * Usage (locally):
 *   STUDIO_USER=admin STUDIO_PASS=supersecret node scripts/secure-studio.js
 *
 * On Render: set the Start Command to `node scripts/secure-studio.js`
 * and configure STUDIO_USER / STUDIO_PASS as environment variables.
 * ────────────────────────────────────────────────────────────────────────────
 */

const { spawn }       = require('child_process');
const http            = require('http');
const httpProxy       = require('http-proxy');

const STUDIO_USER = process.env.STUDIO_USER;
const STUDIO_PASS = process.env.STUDIO_PASS;
const PUBLIC_PORT = parseInt(process.env.PORT, 10) || 4000;
const STUDIO_PORT = 5555; // internal, never exposed

if (!STUDIO_USER || !STUDIO_PASS) {
  console.error(
    '[secure-studio] FATAL: STUDIO_USER and STUDIO_PASS environment variables are required.',
  );
  process.exit(1);
}

// ── 1. Spawn Prisma Studio on the internal port ────────────────────────────
const studio = spawn('npx', ['prisma', 'studio', '--port', String(STUDIO_PORT), '--browser', 'none', '--hostname', '127.0.0.1'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

studio.on('error', (err) => {
  console.error('[secure-studio] Failed to start Prisma Studio:', err.message);
  process.exit(1);
});

// ── 2. Wait for Prisma Studio to boot, then start the auth proxy ───────────
setTimeout(() => {
  const proxy = httpProxy.createProxyServer({
    target: `http://127.0.0.1:${STUDIO_PORT}`,
    ws: true,
  });

  proxy.on('error', (err, _req, res) => {
    console.error('[secure-studio] Proxy error:', err.message);
    if (res && typeof res.writeHead === 'function') {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Prisma Studio is starting up. Try again in a moment.');
    }
  });

  const server = http.createServer((req, res) => {
    // ── Basic Auth check ──────────────────────────────────────────────────
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Basic ')) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="Prisma Studio"',
        'Content-Type': 'text/plain',
      });
      return res.end('Authentication required.');
    }

    const base64 = authHeader.slice(6);
    const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');

    // Constant-time comparison to prevent timing attacks
    const userOk =
      user.length === STUDIO_USER.length &&
      require('crypto').timingSafeEqual(Buffer.from(user), Buffer.from(STUDIO_USER));
    const passOk =
      pass.length === STUDIO_PASS.length &&
      require('crypto').timingSafeEqual(Buffer.from(pass), Buffer.from(STUDIO_PASS));

    if (!userOk || !passOk) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="Prisma Studio"',
        'Content-Type': 'text/plain',
      });
      return res.end('Invalid credentials.');
    }

    // ── Proxy to Prisma Studio ────────────────────────────────────────────
    proxy.web(req, res);
  });

  // WebSocket upgrade (Prisma Studio uses WS for live queries)
  server.on('upgrade', (req, socket, head) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Basic ')) {
      socket.destroy();
      return;
    }
    const base64 = authHeader.slice(6);
    const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
    const userOk =
      user.length === STUDIO_USER.length &&
      require('crypto').timingSafeEqual(Buffer.from(user), Buffer.from(STUDIO_USER));
    const passOk =
      pass.length === STUDIO_PASS.length &&
      require('crypto').timingSafeEqual(Buffer.from(pass), Buffer.from(STUDIO_PASS));

    if (!userOk || !passOk) {
      socket.destroy();
      return;
    }
    proxy.ws(req, socket, head);
  });

  server.listen(PUBLIC_PORT, () => {
    console.log(`[secure-studio] 🔒 Prisma Studio proxy listening on port ${PUBLIC_PORT}`);
    console.log(`[secure-studio]    Basic Auth required (user: ${STUDIO_USER})`);
  });
}, 3000);

// ── 3. Graceful shutdown ───────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[secure-studio] Shutting down...');
  studio.kill('SIGTERM');
  process.exit(0);
});
