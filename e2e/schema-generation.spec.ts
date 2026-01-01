import { test, expect } from '@playwright/test';

test('should generate a schema from a text prompt', async ({ page }) => {
  // This test requires the GEMINI_API_KEY to be set in the environment.
  // We assume the dev server is started with the key available.
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Skipping E2E test: GEMINI_API_KEY is not set.');
    test.skip(true, 'GEMINI_API_KEY is not set.');
    return;
  }

  await page.goto('/');

  // Wait for the main UI to be ready
  await expect(page.getByRole('heading', { name: 'Describe Your Schema' })).toBeVisible();

  // Type a prompt and send it
  await page.getByPlaceholder('Type your message or add files...').fill('Create a table for users with an id and a name.');
  await page.getByRole('button', { name: 'Send' }).click();

  // Click the generate button
  await page.getByRole('button', { name: 'Generate Schema' }).click();

  // Wait for the "Refine" tab to become active, which indicates success
  // Increase timeout because the AI call can be slow
  await expect(page.getByRole('tab', { name: 'Refine' })).toHaveClass(/bg-brand-secondary/, { timeout: 30000 });

  // Verify the schema output is visible
  await expect(page.getByText('users')).toBeVisible();
  await expect(page.getByText('id')).toBeVisible();
  await expect(page.getByText('name')).toBeVisible();
});
