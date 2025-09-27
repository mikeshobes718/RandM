import { test, expect } from '@playwright/test';

const EMAIL = process.env.SMOKE_EMAIL || 'xuhafij415@zizo7.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'T@st1234';

test('business setup flow - reproduce the issue', async ({ page, baseURL }) => {
  const origin = baseURL ?? 'https://reviewsandmarketing.com';
  
  console.log('=== TESTING BUSINESS SETUP FLOW ===');
  
  // Clear all storage first
  await page.context().clearCookies();
  await page.context().clearPermissions();
  
  // Login fresh
  console.log('Step 1: Fresh login...');
  await page.goto(`${origin}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for authentication
  await page.waitForResponse(async (response) => {
    if (response.url().includes('/api/auth/me') && response.status() === 200) {
      const json = await response.json();
      console.log('Auth response:', json);
      return json.uid && json.emailVerified === true;
    }
    return false;
  }, { timeout: 30000 });
  
  console.log('Step 2: Going to onboarding...');
  await page.goto(`${origin}/onboarding/business`, { waitUntil: 'networkidle' });
  
  // Check if we need to connect a business
  const connectPrompt = await page.locator('text=Connect your business profile').isVisible();
  if (connectPrompt) {
    console.log('Step 3: Connecting business...');
    
    // Fill in business details
    const search = page.getByLabel('Search');
    if (await search.isVisible()) {
      await search.fill('Smart Fit');
      await page.waitForTimeout(1000);
      
      const suggestion = page.locator('button').filter({ hasText: /smart fit/i }).first();
      if (await suggestion.count()) {
        await suggestion.click();
        console.log('Selected business suggestion');
      } else {
        // Fallback
        console.log('No suggestions, using fallback');
        await page.locator('input[name="name"]').fill('Test Business');
        await page.locator('input[name="google_place_id"]').fill('test-place-id');
        await page.locator('input[name="google_maps_place_uri"]').fill('https://maps.google.com/test');
        await page.locator('input[name="review_link"]').fill('https://reviews.google.com/test');
        await page.locator('input[name="address"]').fill('123 Test St');
      }
      
      console.log('Step 4: Clicking Save and continue...');
      await page.getByRole('button', { name: /save and continue/i }).click();
      
      // Wait for redirect
      await page.waitForTimeout(3000);
      console.log('After save, URL:', page.url());
      
      // Check for the issues
      const unauthorizedBanner = await page.locator('text=Unauthorized').isVisible();
      const connectPromptAfter = await page.locator('text=Connect your business profile').isVisible();
      const completeSetupButton = await page.locator('text=Complete setup').isVisible();
      
      console.log('=== ISSUES CHECK ===');
      console.log('Unauthorized banner visible:', unauthorizedBanner);
      console.log('Connect business prompt visible:', connectPromptAfter);
      console.log('Complete setup button visible:', completeSetupButton);
      
      if (unauthorizedBanner) {
        console.log('❌ UNAUTHORIZED BANNER STILL PRESENT');
      }
      if (connectPromptAfter) {
        console.log('❌ CONNECT BUSINESS PROMPT STILL PRESENT');
      }
      if (completeSetupButton) {
        console.log('❌ COMPLETE SETUP BUTTON STILL PRESENT');
      }
      
      // Check if we're on dashboard
      if (page.url().includes('/dashboard')) {
        console.log('✅ On dashboard');
      } else {
        console.log('❌ Not on dashboard, URL:', page.url());
      }
      
      // Take screenshot
      await page.screenshot({ path: 'business-setup-issue.png', fullPage: true });
      console.log('Screenshot saved as business-setup-issue.png');
    }
  } else {
    console.log('No connect prompt - business might already be connected');
  }
  
  console.log('=== END TEST ===');
});
