#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const TEST_EMAIL = process.env.TEST_EMAIL || 'tugereyu58@ramcen.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'T@st1234';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function goto(page, url) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { status: res?.status() || 0, url: page.url() };
}

async function testLogin(page) {
  console.log('🔐 Testing login flow...');
  
  // Go to login page
  await goto(page, `${BASE}/login`);
  console.log('📍 On login page:', page.url());
  
  // Wait for form to load
  await sleep(2000);
  
  // Fill in credentials
  console.log('📝 Filling login form...');
  await page.type('input[type="email"]', TEST_EMAIL, { delay: 50 });
  await page.type('input[type="password"]', TEST_PASSWORD, { delay: 50 });
  
  // Check form state
  const formData = await page.evaluate(() => {
    const email = document.querySelector('input[type="email"]')?.value || '';
    const password = document.querySelector('input[type="password"]')?.value || '';
    const submitBtn = document.querySelector('button[type="submit"]');
    return {
      email: email.substring(0, 10) + '...',
      passwordLength: password.length,
      submitDisabled: submitBtn?.disabled || false,
      submitText: submitBtn?.textContent?.trim() || 'none'
    };
  });
  console.log('📋 Form state:', formData);
  
  // Submit the form
  console.log('🚀 Submitting login form...');
  await page.click('button[type="submit"]');
  
  // Monitor the response
  console.log('⏳ Waiting for authentication response...');
  
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const currentUrl = page.url();
    console.log(`[${i+1}/30] Current URL: ${currentUrl}`);
    
    // Check for success indicators
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/pricing') || currentUrl === BASE) {
      console.log('✅ Successfully logged in! Redirected to:', currentUrl);
      return { success: true, url: currentUrl };
    }
    
    // Check if we're still on login page (authentication failed)
    if (currentUrl.includes('/login') && i > 5) {
      console.log('❌ Still on login page - authentication failed');
      
      // Check for error messages
      const errorMsg = await page.evaluate(() => {
        const errorEl = document.querySelector('[class*="error"], [class*="alert"], .text-red-500, .text-red-600');
        return errorEl?.textContent?.trim() || 'No error message found';
      });
      console.log('🚨 Error message:', errorMsg);
      
      return { success: false, error: errorMsg, url: currentUrl };
    }
    
    // Check for verification page
    if (currentUrl.includes('/verify-email')) {
      console.log('📧 Redirected to email verification page');
      return { success: false, error: 'Email verification required', url: currentUrl };
    }
  }
  
  console.log('⏰ Timeout waiting for authentication');
  return { success: false, error: 'Timeout', url: page.url() };
}

async function checkAuthStatus(page) {
  console.log('\n🔐 Checking authentication status...');
  
  const authResponse = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const text = await response.text();
      return {
        status: response.status,
        text: text.substring(0, 100),
        ok: response.ok
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('📡 /api/auth/me response:', authResponse);
  
  return authResponse;
}

async function run() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--window-size=1200,800'] 
  });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Starting login test...');
    console.log(`📧 Test email: ${TEST_EMAIL}`);
    console.log(`🌐 Base URL: ${BASE}`);
    
    // Check initial auth status
    await goto(page, BASE);
    await checkAuthStatus(page);
    
    // Try to login
    const loginResult = await testLogin(page);
    console.log('\n📊 Login result:', loginResult);
    
    // Check auth status after login attempt
    await checkAuthStatus(page);
    
    // Keep browser open for inspection
    console.log('\n🔍 Keeping browser open for 30 seconds to inspect...');
    await sleep(30000);
    await browser.close();
  } catch (e) {
    console.error('❌ Login test failed:', e);
    await browser.close();
    process.exit(1);
  }
}

run();











