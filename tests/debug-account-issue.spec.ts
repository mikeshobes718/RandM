import { test, expect } from '@playwright/test';

const EMAIL = 'lolugik370@veb37.com'; // The email from your screenshot
const PASSWORD = 'T@st1234';

test('debug account issue - check why onboarding redirect fails', async ({ page, baseURL }) => {
  const origin = baseURL ?? 'https://reviewsandmarketing.com';
  
  console.log('=== DEBUGGING ACCOUNT ISSUE ===');
  console.log('Email:', EMAIL);
  
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
  const authResponse = await page.waitForResponse(async (response) => {
    if (response.url().includes('/api/auth/me') && response.status() === 200) {
      const json = await response.json();
      console.log('Auth response:', json);
      return json.uid && json.emailVerified === true;
    }
    return false;
  }, { timeout: 30000 });
  
  console.log('Step 2: Testing /api/businesses/me endpoint...');
  
  // Test the businesses/me endpoint directly
  const businessesResponse = await page.request.get(`${origin}/api/businesses/me`);
  console.log('Businesses/me status:', businessesResponse.status());
  console.log('Businesses/me response:', await businessesResponse.text());
  
  // Test with Authorization header
  const idToken = await page.evaluate(() => localStorage.getItem('idToken'));
  console.log('ID Token present:', !!idToken);
  
  if (idToken) {
    const businessesResponseWithAuth = await page.request.get(`${origin}/api/businesses/me`, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    console.log('Businesses/me with auth status:', businessesResponseWithAuth.status());
    console.log('Businesses/me with auth response:', await businessesResponseWithAuth.text());
  }
  
  console.log('Step 3: Going to onboarding page...');
  await page.goto(`${origin}/onboarding/business`, { waitUntil: 'networkidle' });
  
  console.log('Current URL after onboarding:', page.url());
  
  // Check if we're still on onboarding or redirected to dashboard
  if (page.url().includes('/onboarding/business')) {
    console.log('❌ Still on onboarding page - redirect failed');
    
    // Check what the page shows
    const connectPrompt = await page.locator('text=Connect your business profile').isVisible();
    const completeSetupButton = await page.locator('text=Complete setup').isVisible();
    
    console.log('Connect business prompt visible:', connectPrompt);
    console.log('Complete setup button visible:', completeSetupButton);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-account-issue.png', fullPage: true });
    console.log('Screenshot saved as debug-account-issue.png');
  } else {
    console.log('✅ Redirected to dashboard successfully');
  }
  
  console.log('=== END DEBUG ===');
});
