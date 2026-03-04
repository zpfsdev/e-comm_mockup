import { test, expect } from '@playwright/test';

test('customer can browse products and reach checkout redirect', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();

  await page.goto('/products');
  await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();

  const firstAddButton = page
    .getByRole('button', { name: /add .* to cart/i, exact: false })
    .first();
  await firstAddButton.click({ trial: true });

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: /my cart/i })).toBeVisible();

  const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
  await checkoutLink.click();

  await expect(page).toHaveURL(/auth\/sign-in\?from=%2Fcheckout/);
});

