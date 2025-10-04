import { test, expect } from '@playwright/test';

const EMAIL = process.env.SMOKE_EMAIL || 'xuhafij415@zizo7.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'T@st1234';

test.describe('Unauthorized banner and business prompt fixes', () => {
  test('should not show unauthorized banner on dashboard', async ({ page, baseURL }) => {
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
    
    // Go to dashboard
    await page.goto(`${origin}/dashboard`, { waitUntil: 'networkidle' });
    
    // Check for unauthorized banner - should not be visible
    const unauthorizedBanner = page.locator('text=Unauthorized').or(page.locator('[class*="error"]').filter({ hasText: /unauthorized/i }));
    await expect(unauthorizedBanner).not.toBeVisible({ timeout: 5000 });
    
    // Check that email is displayed in header
    const emailDisplay = page.locator('text=' + EMAIL);
    await expect(emailDisplay).toBeVisible({ timeout: 10000 });
  });

  test('should not show connect business prompt if business exists', async ({ page, baseURL }) => {
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
    
    // Go to onboarding page
    await page.goto(`${origin}/onboarding/business`, { waitUntil: 'networkidle' });
    
    // Wait a bit for any API calls to complete
    await page.waitForTimeout(2000);
    
    // Check for unauthorized banner - should not be visible
    const unauthorizedBanner = page.locator('text=Unauthorized').or(page.locator('[class*="error"]').filter({ hasText: /unauthorized/i }));
    await expect(unauthorizedBanner).not.toBeVisible({ timeout: 5000 });
    
    // Check if "Connect your business profile" prompt is shown
    const connectPrompt = page.locator('text=Connect your business profile').or(page.locator('text=Complete setup'));
    const connectPromptVisible = await connectPrompt.isVisible();
    
    if (connectPromptVisible) {
      console.log('Connect business prompt is visible - checking if business exists via API');
      
      // Check if business exists via API
      const response = await page.request.get(`${origin}/api/businesses/me`);
      const businessData = await response.json();
      
      if (businessData.business) {
        console.log('Business exists but prompt still showing - this is the bug');
        // This should not happen - if business exists, prompt should not show
        expect(connectPrompt).not.toBeVisible();
      } else {
        console.log('No business exists - prompt is expected');
      }
    } else {
      console.log('Connect business prompt not visible - good');
    }
  });

  test('should show email in header when logged in', async ({ page, baseURL }) => {
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
    
    // Go to any page
    await page.goto(`${origin}/dashboard`, { waitUntil: 'networkidle' });
    
    // Check that email is displayed in header
    const emailDisplay = page.locator('text=' + EMAIL);
    await expect(emailDisplay).toBeVisible({ timeout: 10000 });
    
    // Also check the header structure
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});



