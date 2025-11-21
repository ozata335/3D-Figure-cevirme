import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Figür Atölyesi/);

    // Check for the main header
    await expect(page.getByRole('heading', { name: 'Figür Atölyesi' })).toBeVisible();
});
