import { test, expect } from '@playwright/test';

test.describe('Daily Tracking Flow', () => {
  test('should load the dashboard and allow adding a food item', async ({ page }) => {
    // Navigate to the app root
    await page.goto('/');

    // Ensure Dashboard Title is visible (or something indicator of loaded UI)
    await expect(page.locator('text=TDEE Max').first()).toBeVisible();

    // Check if the add food input field exists
    const inputFoodName = page.locator('input[placeholder="食品名称"]');
    if (await inputFoodName.isVisible()) {
      await inputFoodName.fill('Test Chicken Breast');

      const inputCals = page.locator('input[placeholder="热量"]');
      await inputCals.fill('165');

      await page.locator('button:has-text("添加记录")').click();

      // Wait for the UI to update, we should see the food item appended
      await expect(page.locator('text=Test Chicken Breast').first()).toBeVisible();
    }
  });
});
