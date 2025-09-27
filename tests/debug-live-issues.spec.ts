import { test, expect } from '@playwright/test';

const EMAIL = process.env.SMOKE_EMAIL || 'xuhafij415@zizo7.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'T@st1234';

test('debug live site issues', async ({ page, baseURL }) => {
  const origin = baseURL ?? 'https://reviewsandmarketing.com';
  
  console.log('=== DEBUGGING LIVE SITE ISSUES ===');
  
  // Login
  console.log('Step 1: Logging in...');
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
  
  console.log('Step 2: Testing dashboard...');
  await page.goto(`${origin}/dashboard`, { waitUntil: 'networkidle' });
  
  // Wait for any background API calls
  await page.waitForTimeout(3000);
  
  console.log('Current URL:', page.url());
  
  // Check for unauthorized banner
  const unauthorizedElements = await page.locator('text=Unauthorized').all();
  const errorElements = await page.locator('[class*="error"]').filter({ hasText: /unauthorized/i }).all();
  
  console.log('Unauthorized elements found:', unauthorizedElements.length);
  console.log('Error elements found:', errorElements.length);
  
  if (unauthorizedElements.length > 0) {
    console.log('❌ UNAUTHORIZED BANNER STILL PRESENT');
    for (const el of unauthorizedElements) {
      console.log('Unauthorized text:', await el.textContent());
    }
  } else {
    console.log('✅ No unauthorized banner');
  }
  
  // Check for email in header
  const emailInHeader = await page.locator('text=' + EMAIL).isVisible();
  console.log('Email visible in header:', emailInHeader);
  
  if (!emailInHeader) {
    console.log('❌ EMAIL NOT VISIBLE IN HEADER');
  } else {
    console.log('✅ Email visible in header');
  }
  
  // Check for business connect prompt
  const connectPrompt = await page.locator('text=Connect your business profile').or(page.locator('text=Complete setup')).isVisible();
  console.log('Connect business prompt visible:', connectPrompt);
  
  if (connectPrompt) {
    console.log('❌ CONNECT BUSINESS PROMPT STILL SHOWING');
    
    // Check if business exists via API
    const response = await page.request.get(`${origin}/api/businesses/me`);
    const businessData = await response.json();
    console.log('Business data:', businessData);
    
    if (businessData.business) {
      console.log('❌ BUSINESS EXISTS BUT PROMPT STILL SHOWING - This is the bug!');
    }
  } else {
    console.log('✅ No connect business prompt');
  }
  
  // Check for redirects
  if (page.url().includes('/verify-email')) {
    console.log('❌ REDIRECTED TO VERIFY EMAIL');
  } else if (page.url().includes('/pricing')) {
    console.log('❌ REDIRECTED TO PRICING');
  } else if (page.url().includes('/dashboard')) {
    console.log('✅ On dashboard');
  } else {
    console.log('❌ UNEXPECTED REDIRECT to:', page.url());
  }
  
  // Check plan status
  const planBadge = page.locator('[class*="rounded-full"]').filter({ hasText: /plan/i });
  if (await planBadge.isVisible()) {
    const planText = await planBadge.textContent();
    console.log('Plan badge text:', planText);
  }
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'debug-live-issues.png', fullPage: true });
  console.log('Screenshot saved as debug-live-issues.png');
  
  console.log('=== END DEBUG ===');
});
