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

async function debugSignIn(page) {
  console.log('🔍 Debugging sign-in flow...');
  
  // Go to sign-in page
  await goto(page, `${BASE}/signin`);
  console.log('📍 On sign-in page:', page.url());
  
  // Check if we're already redirected somewhere
  if (!page.url().includes('/signin')) {
    console.log('⚠️  Already redirected from sign-in page to:', page.url());
    return;
  }
  
  // Fill in credentials
  console.log('📝 Filling sign-in form...');
  await page.type('input[type="email"]', TEST_EMAIL, { delay: 50 });
  await page.type('input[type="password"]', TEST_PASSWORD, { delay: 50 });
  
  // Check form state before submitting
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
  console.log('🚀 Submitting sign-in form...');
  await page.click('button[type="submit"]');
  
  // Wait and monitor redirects
  console.log('⏳ Waiting for authentication...');
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const currentUrl = page.url();
    console.log(`[${i+1}/30] Current URL: ${currentUrl}`);
    
    // Check for success indicators
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/pricing') || currentUrl === BASE) {
      console.log('✅ Successfully signed in! Redirected to:', currentUrl);
      return { success: true, url: currentUrl };
    }
    
    // Check for error indicators
    if (currentUrl.includes('/signin') && i > 5) {
      console.log('❌ Redirected back to sign-in page - authentication failed');
      
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
  
  // Check /api/auth/me
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
  
  // Check for auth cookies
  const cookies = await page.cookies();
  const authCookies = cookies.filter(c => 
    c.name.includes('auth') || 
    c.name.includes('session') || 
    c.name.includes('firebase') ||
    c.name.includes('token')
  );
  console.log('🍪 Auth cookies:', authCookies.map(c => ({ name: c.name, domain: c.domain })));
  
  return { authResponse, authCookies };
}

async function run() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--window-size=1200,800'] 
  });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Starting sign-in debug session...');
    console.log(`📧 Test email: ${TEST_EMAIL}`);
    console.log(`🌐 Base URL: ${BASE}`);
    
    // First check auth status
    await goto(page, BASE);
    await checkAuthStatus(page);
    
    // Try to sign in
    const signInResult = await debugSignIn(page);
    console.log('\n📊 Sign-in result:', signInResult);
    
    // Check auth status after sign-in attempt
    await checkAuthStatus(page);
    
    // Keep browser open for inspection
    console.log('\n🔍 Keeping browser open for 30 seconds to inspect...');
    await sleep(30000);
    await browser.close();
  } catch (e) {
    console.error('❌ Debug failed:', e);
    await browser.close();
    process.exit(1);
  }
}

run();











