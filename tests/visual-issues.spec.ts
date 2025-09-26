import { test, expect } from '@playwright/test';

const EMAIL = process.env.SMOKE_EMAIL || 'xuhafij415@zizo7.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'T@st1234';

test('check for unauthorized banner and business prompt issues', async ({ page, baseURL }) => {
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
  
  console.log('Testing dashboard for unauthorized banner...');
  await page.goto(`${origin}/dashboard`, { waitUntil: 'networkidle' });
  
  // Wait a bit for any background API calls
  await page.waitForTimeout(3000);
  
  // Check for unauthorized banner
  const unauthorizedElements = await page.locator('text=Unauthorized').all();
  const errorElements = await page.locator('[class*="error"]').filter({ hasText: /unauthorized/i }).all();
  
  console.log('Unauthorized text elements found:', unauthorizedElements.length);
  console.log('Error elements found:', errorElements.length);
  
  if (unauthorizedElements.length > 0 || errorElements.length > 0) {
    console.log('FOUND UNAUTHORIZED BANNER - This is the bug!');
    await page.screenshot({ path: 'unauthorized-banner-bug.png', fullPage: true });
  } else {
    console.log('No unauthorized banner found - good!');
  }
  
  // Check for email in header
  const emailInHeader = await page.locator('text=' + EMAIL).isVisible();
  console.log('Email visible in header:', emailInHeader);
  
  if (!emailInHeader) {
    console.log('EMAIL NOT VISIBLE IN HEADER - This is the bug!');
    await page.screenshot({ path: 'email-not-in-header.png', fullPage: true });
  }
  
  console.log('Testing onboarding page for business prompt...');
  await page.goto(`${origin}/onboarding/business`, { waitUntil: 'networkidle' });
  
  // Wait for any API calls
  await page.waitForTimeout(3000);
  
  // Check for unauthorized banner on onboarding
  const onboardingUnauthorized = await page.locator('text=Unauthorized').all();
  const onboardingErrors = await page.locator('[class*="error"]').filter({ hasText: /unauthorized/i }).all();
  
  console.log('Onboarding unauthorized elements:', onboardingUnauthorized.length);
  console.log('Onboarding error elements:', onboardingErrors.length);
  
  if (onboardingUnauthorized.length > 0 || onboardingErrors.length > 0) {
    console.log('FOUND UNAUTHORIZED BANNER ON ONBOARDING - This is the bug!');
    await page.screenshot({ path: 'onboarding-unauthorized-bug.png', fullPage: true });
  }
  
  // Check for business connect prompt
  const connectPrompt = await page.locator('text=Connect your business profile').or(page.locator('text=Complete setup')).isVisible();
  console.log('Connect business prompt visible:', connectPrompt);
  
  if (connectPrompt) {
    console.log('FOUND CONNECT BUSINESS PROMPT - Checking if business exists...');
    
    // Check if business exists via API
    const response = await page.request.get(`${origin}/api/businesses/me`);
    const businessData = await response.json();
    console.log('Business data:', businessData);
    
    if (businessData.business) {
      console.log('BUSINESS EXISTS BUT PROMPT STILL SHOWING - This is the bug!');
      await page.screenshot({ path: 'business-exists-but-prompt-shows.png', fullPage: true });
    } else {
      console.log('No business exists - prompt is expected');
    }
  } else {
    console.log('No connect business prompt - good!');
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'final-state.png', fullPage: true });
});
