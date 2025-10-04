import { test, expect } from '@playwright/test';

const EMAIL = process.env.SMOKE_EMAIL || 'xuhafij415@zizo7.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'T@st1234';

test('dashboard should not redirect after business connection', async ({ page, baseURL }) => {
  const origin = baseURL ?? 'https://reviewsandmarketing.com';
  
  // Login
  await page.goto(`${origin}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for authentication
  await page.waitForResponse(async (response) => {
    if (response.url().includes('/api/auth/me') && response.status() === 200) {
      const json = await response.json();
      return json.uid && json.emailVerified === true;
    }
    return false;
  }, { timeout: 30000 });
  
  console.log('Step 1: Going to onboarding to connect business');
  await page.goto(`${origin}/onboarding/business`, { waitUntil: 'networkidle' });
  
  // Check if we need to connect a business or if we're already redirected
  const connectPrompt = await page.locator('text=Connect your business profile').isVisible();
  if (connectPrompt) {
    console.log('Step 2: Business not connected, connecting now...');
    
    // Fill in business details
    const search = page.getByLabel('Search');
    await search.fill('Smart Fit');
    await page.waitForTimeout(1000);
    
    const suggestion = page.locator('button').filter({ hasText: /smart fit/i }).first();
    if (await suggestion.count()) {
      await suggestion.click();
    } else {
      // Fallback if no suggestions appear
      await page.locator('input[name="name"]').fill('Test Business');
      await page.locator('input[name="google_place_id"]').fill('test-place-id');
      await page.locator('input[name="google_maps_place_uri"]').fill('https://maps.google.com/test');
      await page.locator('input[name="review_link"]').fill('https://reviews.google.com/test');
      await page.locator('input[name="address"]').fill('123 Test St');
    }
    
    console.log('Step 3: Saving business details');
    await page.getByRole('button', { name: /save and continue/i }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL(`${origin}/dashboard**`, { waitUntil: 'networkidle' });
  } else {
    console.log('Step 2: Business already connected, going to dashboard');
    await page.goto(`${origin}/dashboard`, { waitUntil: 'networkidle' });
  }
  
  console.log('Step 4: Verifying we are on dashboard and not redirected');
  expect(page.url()).toContain('/dashboard');
  expect(page.url()).not.toContain('/pricing');
  expect(page.url()).not.toContain('/verify-email');
  
  // Check that dashboard content is visible
  const dashboardTitle = page.locator('text=Your reputation command center');
  await expect(dashboardTitle).toBeVisible({ timeout: 10000 });
  
  console.log('Step 5: Checking for plan status');
  const planBadge = page.locator('[class*="rounded-full"]').filter({ hasText: /plan/i });
  const planBadgeVisible = await planBadge.isVisible();
  
  if (planBadgeVisible) {
    const planText = await planBadge.textContent();
    console.log('Plan badge text:', planText);
    // Should show "Starter plan" or similar, not redirect to pricing
    expect(planText).toMatch(/starter|pro|trial/i);
  }
  
  console.log('SUCCESS: Dashboard loads correctly without redirects');
});



