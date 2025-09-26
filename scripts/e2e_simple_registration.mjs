#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const TEST_EMAIL = process.env.TEST_EMAIL || `test-${Date.now()}@example.com`;
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function goto(page, url) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { status: res?.status() || 0, url: page.url() };
}

async function register(page) {
  console.log(`Registering new user: ${TEST_EMAIL}`);
  await goto(page, `${BASE}/register`);
  await page.waitForSelector('input[type=email]', { timeout: 30000 });
  
  // Clear any existing values
  await page.evaluate(() => {
    const emailInput = document.querySelector('input[type=email]');
    const passwordInput = document.querySelector('input[type=password]');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
  });
  
  await page.type('input[type=email]', TEST_EMAIL, { delay: 10 });
  await page.type('input[type=password]', TEST_PASSWORD, { delay: 10 });
  
  // Check for any validation errors before submitting
  const validationErrors = await page.evaluate(() => {
    const errors = [];
    const errorElements = document.querySelectorAll('[class*="error"], .text-red-500, .text-red-600');
    errorElements.forEach(el => {
      if (el.textContent.trim()) {
        errors.push(el.textContent.trim());
      }
    });
    return errors;
  });
  
  if (validationErrors.length > 0) {
    console.log('Validation errors found:', validationErrors);
  }
  
  await page.click('button[type="submit"]');
  await sleep(5000); // Wait longer to see what happens
  
  // Check for any error messages after submission
  const errorMessages = await page.evaluate(() => {
    const errors = [];
    const errorElements = document.querySelectorAll('[class*="error"], .text-red-500, .text-red-600, .bg-red-50');
    errorElements.forEach(el => {
      if (el.textContent.trim()) {
        errors.push(el.textContent.trim());
      }
    });
    return errors;
  });
  
  if (errorMessages.length > 0) {
    console.log('Error messages after submission:', errorMessages);
  }
  
  // Check current URL and page content
  const currentUrl = page.url();
  const pageContent = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim());
    return {
      title: document.title,
      hasVerifyButton: buttons.some(text => text.includes('I verified')),
      hasResendButton: buttons.some(text => text.includes('Resend')),
      allButtons: buttons,
      bodyText: document.body.innerText.substring(0, 500)
    };
  });
  
  console.log('Current URL after registration:', currentUrl);
  console.log('Page content:', pageContent);
  
  // Check auth status
  const authStatus = await page.evaluate(async () => {
    try { 
      const r = await fetch('/api/auth/me', { cache:'no-store' }); 
      return { ok: r.ok, status: r.status };
    } catch (e) { 
      return { ok: false, error: e.message };
    }
  });
  console.log('Auth status after registration:', authStatus);
  
  return { currentUrl, pageContent, authStatus, errorMessages };
}

async function run() {
  const browser = await puppeteer.launch({ 
    headless: false, // Run in visible mode for debugging
    args: ['--no-sandbox', '--window-size=1200,800'] 
  });
  const page = await browser.newPage();
  
  try {
    const result = await register(page);
    console.log('Registration result:', JSON.stringify(result, null, 2));
    
    // Keep browser open for inspection
    console.log('Keeping browser open for 15 seconds to inspect...');
    await sleep(15000);
    await browser.close();
  } catch (e) {
    console.error('Registration test failed:', e);
    await browser.close();
    process.exit(1);
  }
}

run();











