import { test, expect } from '@playwright/test';

test('should display welcome message', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await expect(page).toHaveTitle('Timelock');
  await expect(page.locator('h1')).toHaveText('Hello, timelock');
});
