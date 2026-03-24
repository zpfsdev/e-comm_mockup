import { test, expect } from '@playwright/test';
import { CUSTOMER_AUTH_FILE } from './auth-constants';

// ─── Unauthenticated browsing ─────────────────────────────────────────────────
test.use({ storageState: { cookies: [], origins: [] } });

test('unauthenticated: can browse products and is redirected to sign-in from checkout', async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();

  await page.goto('/products');
  
  // Wait for at least one product card to be visible in the main content area
  const productLink = page.locator('main a[href^="/products/"]').first();
  await productLink.waitFor({ state: 'visible', timeout: 15_000 });
  
  const href = await productLink.getAttribute('href');
  if (!href) throw new Error('First product link not found');
  await page.goto(href);
  await expect(page).toHaveURL(/\/products\/\d+/);

  const addBtn = page.getByRole('button', { name: /add to cart/i });
  await addBtn.click();
  
  // As a guest, it should redirect to sign-in from the product page
  await expect(page).toHaveURL(/auth\/sign-in/);
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

  // Directly verify redirection from checkout as well
  await page.goto('/checkout');
  await expect(page).toHaveURL(/auth\/sign-in.*from=.*checkout/);
});

// ─── Authenticated customer flows ─────────────────────────────────────────────

const authenticatedTest = test.extend<object>({});

authenticatedTest.use({ storageState: CUSTOMER_AUTH_FILE });

authenticatedTest.beforeEach(async ({ page }) => {
  // Restore CSRF token from localStorage (where it was saved by auth setup) 
  // into sessionStorage (where the web app expects it).
  await page.addInitScript(() => {
    const csrf = localStorage.getItem('csrfToken');
    if (csrf) sessionStorage.setItem('csrfToken', csrf);
  });
});

authenticatedTest('sign-in: customer lands on homepage after successful login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /my cart|shopping cart/i })).toBeVisible();
});

authenticatedTest('cart: can add a product, update quantity, and remove it', async ({ page }) => {
  await page.goto('/products');
  const productLink = page.locator('main a[href^="/products/"]').first();
  await productLink.waitFor({ state: 'visible', timeout: 15_000 });
  
  const href = await productLink.getAttribute('href');
  if (!href) throw new Error('First product link not found');
  await page.goto(href);
  await expect(page).toHaveURL(/\/products\/\d+/);

  const addBtn = page.getByRole('button', { name: /add to cart/i });
  await addBtn.click();
  await expect(page.getByText(/added to cart/i)).toBeVisible({ timeout: 10_000 });

  await page.goto('/cart');
  const heading = page.getByRole('heading', { name: /my cart/i });
  await expect(heading).toBeVisible();

  const increaseBtn = page.getByRole('button', { name: /increase quantity/i }).first();
  if (await increaseBtn.isVisible()) {
    await increaseBtn.click();
    await expect(page.getByText(/qty: 2|2 items/i)).toBeVisible();
  }

  const removeBtn = page.getByRole('button', { name: /remove .* from cart/i }).first();
  await removeBtn.click();

  await expect(page.getByText(/your cart is empty/i)).toBeVisible();
});

authenticatedTest('cart: shows order summary with correct totals', async ({ page }) => {
  await page.goto('/products');
  const productLink = page.locator('main a[href^="/products/"]').first();
  await productLink.waitFor({ state: 'visible', timeout: 15_000 });
  
  const href = await productLink.getAttribute('href');
  if (!href) throw new Error('First product link not found');
  await page.goto(href);
  await expect(page).toHaveURL(/\/products\/\d+/);

  const addBtn = page.getByRole('button', { name: /add to cart/i });
  await addBtn.click();
  await expect(page.getByText(/added to cart/i)).toBeVisible({ timeout: 10_000 });

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: /my cart/i })).toBeVisible();
  await expect(page.getByText('Order Summary', { exact: true })).toBeVisible();
  await expect(page.getByText('Total', { exact: true })).toBeVisible();

  const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
  await expect(checkoutLink).toBeVisible();

  await page.getByRole('button', { name: /remove .* from cart/i }).first().click();
});

authenticatedTest('checkout: authenticated customer can reach checkout page', async ({ page }) => {
  await page.goto('/products');
  const productLink = page.locator('main a[href^="/products/"]').first();
  await productLink.waitFor({ state: 'visible', timeout: 15_000 });
  
  const href = await productLink.getAttribute('href');
  if (!href) throw new Error('First product link not found');
  await page.goto(href);
  await expect(page).toHaveURL(/\/products\/\d+/);

  const addBtn = page.getByRole('button', { name: /add to cart/i });
  await addBtn.click();
  await expect(page.getByText(/added to cart/i)).toBeVisible({ timeout: 10_000 });

  await page.goto('/cart');
  const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
  await expect(checkoutLink).toBeVisible({ timeout: 10_000 });
  await checkoutLink.click();

  await expect(page).toHaveURL(/checkout/);
  await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible();

  await page.goto('/cart');
  await page.getByRole('button', { name: /remove .* from cart/i }).first().click();
});

authenticatedTest('orders: orders list page loads and shows history heading', async ({ page }) => {
  await page.goto('/orders');
  await expect(
    page.getByRole('heading', { name: /my orders/i }),
  ).toBeVisible({ timeout: 10_000 });
});

authenticatedTest('orders: empty state shows helpful message when no orders', async ({ page }) => {
  await page.goto('/orders');
  const heading = page.getByRole('heading', { name: /my orders/i });
  await expect(heading).toBeVisible({ timeout: 10_000 });

  const hasOrders = await page.getByRole('link', { name: /order #/i }).count();
  if (hasOrders === 0) {
    await expect(page.getByText(/no orders found/i)).toBeVisible();
  }
});

authenticatedTest('profile: profile page loads with user details', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/manage your account/i)).toBeVisible();
});

authenticatedTest('profile: can update first name and see success message', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible({ timeout: 10_000 });

  const firstNameInput = page.getByLabel(/first name/i);
  await firstNameInput.clear();
  await firstNameInput.fill('TestUpdated');

  const phoneInput = page.getByLabel(/phone number/i);
  await phoneInput.clear();
  await phoneInput.fill('09171234567');

  const saveBtn = page.getByRole('button', { name: /save/i, exact: true });
  await saveBtn.click();
  await expect(page.getByRole('status')).toContainText('Profile updated successfully!', { timeout: 15_000 });

  await firstNameInput.clear();
  await firstNameInput.fill('Test');
  await saveBtn.click();
});

authenticatedTest('nav: account links are visible when authenticated', async ({ page }) => {
  await page.goto('/');
  // When authenticated, we show a direct link to Profile instead of a dropdown
  await expect(page.getByRole('link', { name: /my profile/i })).toBeVisible();
});
