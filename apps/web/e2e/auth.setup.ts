/**
 * Playwright global auth setup.
 *
 * Signs in as the seeded test customer account and saves browser state to
 * e2e/.auth/customer.json so authenticated tests can reuse the session
 * without repeating the sign-in flow.
 *
 * Run order: this project must be listed before authenticated test projects
 * in playwright.config.ts (see `dependencies`).
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

import { CUSTOMER_AUTH_FILE, SELLER_AUTH_FILE } from './auth-constants';

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3010';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`E2E setup requires ${name} env variable to be set.`);
  return value;
}

const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL ?? 'jane@example.test';
const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD ?? 'password123';
const SELLER_EMAIL = process.env.TEST_SELLER_EMAIL ?? 'seller@giggling.test';
const SELLER_PASSWORD = process.env.TEST_SELLER_PASSWORD ?? 'password123';

/** In CI, credentials must come from env vars — never use defaults. */
if (process.env.CI) {
  requireEnv('TEST_CUSTOMER_EMAIL');
  requireEnv('TEST_CUSTOMER_PASSWORD');
  requireEnv('TEST_SELLER_EMAIL');
  requireEnv('TEST_SELLER_PASSWORD');
}

setup('authenticate as customer', async ({ page }) => {
  await page.goto(`${BASE}/auth/sign-in`);
  await page.locator('#sign-in-email').fill(CUSTOMER_EMAIL);
  await page.locator('#sign-in-password').fill(CUSTOMER_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).not.toHaveURL(/sign-in/, { timeout: 10_000 });

  // Persist CSRF token to localStorage so storageState saves it (sessionStorage is lost).
  await page.evaluate(() => {
    const csrf = sessionStorage.getItem('csrfToken');
    if (csrf) localStorage.setItem('csrfToken', csrf);
  });

  await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
});

setup('authenticate as seller', async ({ page }) => {
  await page.goto(`${BASE}/auth/sign-in`);
  await page.locator('#sign-in-email').fill(SELLER_EMAIL);
  await page.locator('#sign-in-password').fill(SELLER_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).not.toHaveURL(/sign-in/, { timeout: 10_000 });

  // Persist CSRF token to localStorage so storageState saves it (sessionStorage is lost).
  await page.evaluate(() => {
    const csrf = sessionStorage.getItem('csrfToken');
    if (csrf) localStorage.setItem('csrfToken', csrf);
  });

  await page.context().storageState({ path: SELLER_AUTH_FILE });
});
