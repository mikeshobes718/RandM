#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function goto(page, url) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { status: res?.status() || 0, url: page.url() };
}

async function inspectSignInPage(page) {
  console.log('🔍 Inspecting sign-in page...');
  
  await goto(page, `${BASE}/signin`);
  console.log('📍 Current URL:', page.url());
  
  // Wait for page to load
  await sleep(3000);
  
  // Get page title and basic info
  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      bodyText: document.body.textContent.substring(0, 200) + '...'
    };
  });
  console.log('📄 Page info:', pageInfo);
  
  // Look for all input fields
  const inputs = await page.evaluate(() => {
    const inputElements = document.querySelectorAll('input');
    return Array.from(inputElements).map(input => ({
      type: input.type,
      name: input.name,
      id: input.id,
      placeholder: input.placeholder,
      className: input.className,
      selector: `input[type="${input.type}"]${input.name ? `[name="${input.name}"]` : ''}${input.id ? `#${input.id}` : ''}`
    }));
  });
  console.log('📝 Input fields found:', inputs);
  
  // Look for buttons
  const buttons = await page.evaluate(() => {
    const buttonElements = document.querySelectorAll('button, input[type="submit"]');
    return Array.from(buttonElements).map(btn => ({
      tagName: btn.tagName,
      type: btn.type,
      text: btn.textContent.trim(),
      className: btn.className,
      disabled: btn.disabled
    }));
  });
  console.log('🔘 Buttons found:', buttons);
  
  // Look for forms
  const forms = await page.evaluate(() => {
    const formElements = document.querySelectorAll('form');
    return Array.from(formElements).map(form => ({
      action: form.action,
      method: form.method,
      className: form.className,
      childCount: form.children.length
    }));
  });
  console.log('📋 Forms found:', forms);
  
  // Check if there are any error messages
  const errors = await page.evaluate(() => {
    const errorSelectors = [
      '[class*="error"]',
      '[class*="alert"]',
      '.text-red-500',
      '.text-red-600',
      '[role="alert"]'
    ];
    
    const errorElements = [];
    errorSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.textContent.trim()) {
          errorElements.push({
            selector,
            text: el.textContent.trim(),
            className: el.className
          });
        }
      });
    });
    
    return errorElements;
  });
  console.log('🚨 Error messages:', errors);
  
  // Check for any redirects or if we're not on signin page
  if (!page.url().includes('/signin')) {
    console.log('⚠️  Not on sign-in page anymore. Current URL:', page.url());
  }
  
  return { pageInfo, inputs, buttons, forms, errors };
}

async function run() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--window-size=1200,800'] 
  });
  const page = await browser.newPage();
  
  try {
    const result = await inspectSignInPage(page);
    
    console.log('\n' + '='.repeat(60));
    console.log('SIGN-IN PAGE INSPECTION COMPLETE');
    console.log('='.repeat(60));
    
    // Keep browser open for inspection
    console.log('\n🔍 Keeping browser open for 60 seconds to inspect...');
    await sleep(60000);
    await browser.close();
  } catch (e) {
    console.error('❌ Inspection failed:', e);
    await browser.close();
    process.exit(1);
  }
}

run();














