import { test, expect } from '@playwright/test';

const EMAIL = process.env.SMOKE_EMAIL || 'xuhafij415@zizo7.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'T@st1234';

test('fresh session test - simulate new user experience', async ({ page, baseURL }) => {
  const origin = baseURL ?? 'https://reviewsandmarketing.com';
  
  console.log('=== FRESH SESSION TEST ===');
  
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
      console.log('Fresh auth response:', json);
      return json.uid && json.emailVerified === true;
    }
    return false;
  }, { timeout: 30000 });
  
  console.log('Step 2: Testing "Activate Starter" flow...');
  await page.goto(`${origin}/pricing`, { waitUntil: 'networkidle' });
  
  // Look for Activate Starter button
  const activateStarter = page.locator('button').filter({ hasText: /activate starter/i });
  if (await activateStarter.isVisible()) {
    console.log('Found Activate Starter button, clicking...');
    await activateStarter.click();
    await page.waitForTimeout(2000);
    console.log('After Activate Starter click, URL:', page.url());
  } else {
    console.log('No Activate Starter button found');
  }
  
  console.log('Step 3: Testing onboarding flow...');
  await page.goto(`${origin}/onboarding/business`, { waitUntil: 'networkidle' });
  
  // Check if we get redirected or see prompts
  console.log('Onboarding URL:', page.url());
  
  const connectPrompt = await page.locator('text=Connect your business profile').or(page.locator('text=Complete setup')).isVisible();
  console.log('Connect business prompt visible on onboarding:', connectPrompt);
  
  if (connectPrompt) {
    console.log('Step 4: Testing business connection...');
    
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
      
      console.log('Step 5: Saving business...');
      await page.getByRole('button', { name: /save and continue/i }).click();
      
      // Wait for redirect
      await page.waitForTimeout(3000);
      console.log('After save, URL:', page.url());
      
      if (page.url().includes('/verify-email')) {
        console.log('❌ REDIRECTED TO VERIFY EMAIL AFTER SAVE');
      } else if (page.url().includes('/pricing')) {
        console.log('❌ REDIRECTED TO PRICING AFTER SAVE');
      } else if (page.url().includes('/dashboard')) {
        console.log('✅ SUCCESS: Redirected to dashboard after save');
      } else {
        console.log('❌ UNEXPECTED REDIRECT after save:', page.url());
      }
    }
  } else {
    console.log('No connect prompt - business might already be connected');
    console.log('Redirecting to dashboard...');
    await page.goto(`${origin}/dashboard`, { waitUntil: 'networkidle' });
  }
  
  console.log('Step 6: Final dashboard check...');
  console.log('Final URL:', page.url());
  
  // Check for all the issues
  const unauthorizedElements = await page.locator('text=Unauthorized').all();
  const errorElements = await page.locator('[class*="error"]').filter({ hasText: /unauthorized/i }).all();
  const emailInHeader = await page.locator('text=' + EMAIL).isVisible();
  const connectPromptFinal = await page.locator('text=Connect your business profile').or(page.locator('text=Complete setup')).isVisible();
  
  console.log('=== FINAL RESULTS ===');
  console.log('Unauthorized elements:', unauthorizedElements.length);
  console.log('Error elements:', errorElements.length);
  console.log('Email in header:', emailInHeader);
  console.log('Connect prompt:', connectPromptFinal);
  console.log('Current URL:', page.url());
  
  if (page.url().includes('/dashboard')) {
    console.log('✅ SUCCESS: On dashboard');
  } else {
    console.log('❌ NOT ON DASHBOARD');
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'fresh-session-final.png', fullPage: true });
  console.log('Final screenshot saved as fresh-session-final.png');
});



