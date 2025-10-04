import { test, expect } from '@playwright/test';

const EMAIL = process.env.SMOKE_EMAIL || 'xuhafij415@zizo7.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'T@st1234';

test('debug dashboard redirect issue', async ({ page, baseURL }) => {
  const origin = baseURL ?? 'https://reviewsandmarketing.com';
  
  console.log('Step 1: Going to login page');
  await page.goto(`${origin}/login`, { waitUntil: 'networkidle' });
  
  console.log('Step 2: Filling login form');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  console.log('Step 3: Waiting for authentication');
  await page.waitForResponse(async (response) => {
    if (response.url().includes('/api/auth/me') && response.status() === 200) {
      const json = await response.json();
      console.log('Auth response:', json);
      return json.uid && json.emailVerified === true;
    }
    return false;
  }, { timeout: 30000 });
  
  console.log('Step 4: Checking current URL after login');
  console.log('Current URL:', page.url());
  
  console.log('Step 5: Going to dashboard');
  const response = await page.goto(`${origin}/dashboard`, { waitUntil: 'networkidle' });
  console.log('Dashboard response status:', response?.status());
  console.log('Final URL:', page.url());
  
  // Check if we got redirected
  if (page.url().includes('/verify-email')) {
    console.log('REDIRECTED TO VERIFY EMAIL - This is the bug!');
  } else if (page.url().includes('/pricing')) {
    console.log('REDIRECTED TO PRICING - This is the bug!');
  } else if (page.url().includes('/dashboard')) {
    console.log('SUCCESS: On dashboard');
  } else {
    console.log('UNEXPECTED REDIRECT to:', page.url());
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-dashboard.png', fullPage: true });
});



