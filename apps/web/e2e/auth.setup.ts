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

export const CUSTOMER_AUTH_FILE = path.join(__dirname, '.auth', 'customer.json');
export const SELLER_AUTH_FILE = path.join(__dirname, '.auth', 'seller.json');

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL ?? 'testcustomer@artistryx.test';
const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD ?? 'TestPass1!';
const SELLER_EMAIL = process.env.TEST_SELLER_EMAIL ?? 'testseller@artistryx.test';
const SELLER_PASSWORD = process.env.TEST_SELLER_PASSWORD ?? 'TestPass1!';

setup('authenticate as customer', async ({ page }) => {
  await page.goto(`${BASE}/auth/sign-in`);
  await page.getByLabel(/email/i).fill(CUSTOMER_EMAIL);
  await page.getByLabel(/password/i).fill(CUSTOMER_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).not.toHaveURL(/sign-in/, { timeout: 10_000 });
  await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
});

setup('authenticate as seller', async ({ page }) => {
  await page.goto(`${BASE}/auth/sign-in`);
  await page.getByLabel(/email/i).fill(SELLER_EMAIL);
  await page.getByLabel(/password/i).fill(SELLER_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).not.toHaveURL(/sign-in/, { timeout: 10_000 });
  await page.context().storageState({ path: SELLER_AUTH_FILE });
});
