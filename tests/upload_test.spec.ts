import { test, expect } from '@playwright/test';
import path from 'path';

test('upload image and generate', async ({ page }) => {
    // 1. Go to the app
    await page.goto('/');

    // 2. Upload file
    // The file path needs to be absolute or relative to the test file. 
    // I will use the absolute path to the artifact image.
    const filePath = 'C:/Users/moser/.gemini/antigravity/brain/980ffa1a-e6f1-4a0e-bf39-41901f1629ae/sample_character_1763718369037.png';

    // Handle the file chooser which might be triggered by clicking the dropzone
    // Or directly set the input files if the input is present
    await page.setInputFiles('input[type="file"]', filePath);

    // 3. Click Generate
    await page.getByRole('button', { name: 'Hemen 3D ye Çevir' }).click();

    // 4. Wait for generation (timeout increased for AI generation)
    // Wait for the "Oluşturuluyor..." text to disappear
    await expect(page.getByText('Oluşturuluyor...')).not.toBeVisible({ timeout: 30000 });

    // 5. Verify Result
    // Check if the result image is visible
    await expect(page.locator('img[alt="Generated Figurine"]')).toBeVisible();

    // 6. Verify Download Button
    // It might be hidden until hover, so we force check existence or hover
    const downloadBtn = page.getByRole('button', { name: 'İndir' });
    await expect(downloadBtn).toBeAttached();

    // Optional: Click it to ensure no error
    // Note: Actual download verification in headless might be tricky without setup, 
    // but clicking it verifies the handler works.
});
