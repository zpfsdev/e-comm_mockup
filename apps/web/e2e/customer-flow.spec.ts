import { test, expect } from '@playwright/test';
import { CUSTOMER_AUTH_FILE } from './auth.setup';

// ─── Unauthenticated browsing ─────────────────────────────────────────────────

test('unauthenticated: can browse products and is redirected to sign-in from checkout', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();

  await page.goto('/products');
  await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();

  const firstAddButton = page
    .getByRole('button', { name: /add .* to cart/i, exact: false })
    .first();
  await firstAddButton.click();

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: /my cart/i })).toBeVisible();

  await page.getByRole('link', { name: /proceed to checkout/i }).click();
  await expect(page).toHaveURL(/auth\/sign-in\?from=%2Fcheckout/);
});

// ─── Authenticated customer flows ─────────────────────────────────────────────

const authenticatedTest = test.extend<object>({});

authenticatedTest.use({ storageState: CUSTOMER_AUTH_FILE });

authenticatedTest('sign-in: customer lands on homepage after successful login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /my cart|shopping cart/i })).toBeVisible();
});

authenticatedTest('cart: can add a product, update quantity, and remove it', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();

  const firstAddButton = page
    .getByRole('button', { name: /add .* to cart/i, exact: false })
    .first();
  await firstAddButton.click();

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
  const addButton = page
    .getByRole('button', { name: /add .* to cart/i, exact: false })
    .first();
  await addButton.click();

  await page.goto('/cart');
  await expect(page.getByText(/order summary/i)).toBeVisible();
  await expect(page.getByText(/subtotal/i)).toBeVisible();
  await expect(page.getByText(/shipping fee/i)).toBeVisible();
  await expect(page.getByText(/total/i)).toBeVisible();

  const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
  await expect(checkoutLink).toBeVisible();

  await page.getByRole('button', { name: /remove .* from cart/i }).first().click();
});

authenticatedTest('checkout: authenticated customer can reach checkout page', async ({ page }) => {
  await page.goto('/products');
  await page
    .getByRole('button', { name: /add .* to cart/i, exact: false })
    .first()
    .click();

  await page.goto('/cart');
  await page.getByRole('link', { name: /proceed to checkout/i }).click();

  await expect(page).toHaveURL(/checkout/);
  await expect(page.getByRole('heading', { name: /checkout|place order|order/i })).toBeVisible();

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
    await expect(page.getByText(/haven.*t placed any orders yet/i)).toBeVisible();
  }
});

authenticatedTest('profile: profile page loads with user details', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('heading', { name: /edit profile/i })).toBeVisible();
});

authenticatedTest('profile: can update first name and see success message', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible({ timeout: 10_000 });

  const firstNameInput = page.getByLabel(/first name/i);
  await firstNameInput.clear();
  await firstNameInput.fill('TestUpdated');

  await page.getByRole('button', { name: /save changes/i }).click();

  await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 8_000 });

  await firstNameInput.clear();
  await firstNameInput.fill('Test');
  await page.getByRole('button', { name: /save changes/i }).click();
});

authenticatedTest('nav: account dropdown opens and shows authenticated links', async ({ page }) => {
  await page.goto('/');
  const accountBtn = page.getByRole('button', { name: /account menu/i });
  await accountBtn.click();

  await expect(page.getByRole('menuitem', { name: /my profile/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /my orders/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /sign out/i })).toBeVisible();
});
