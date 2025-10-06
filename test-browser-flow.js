#!/usr/bin/env node
const puppeteer = require('puppeteer');

const TEST_EMAIL = 'kewukimu83@mexvat.com';
const TEST_PASSWORD = 'T@st1234';
const BASE_URL = 'https://reviewsandmarketing.com';

async function test() {
  console.log('🌐 Starting browser test...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Set longer timeout
    page.setDefaultTimeout(60000);
    
    // Step 1: Navigate to login
    console.log('Step 1: Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000); // Give it a moment to fully render
    console.log('✅ Login page loaded\n');
    
    // Step 2: Fill in login form
    console.log('Step 2: Filling in login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    console.log('✅ Form filled\n');
    
    // Step 3: Click login button
    console.log('Step 3: Clicking login button...');
    const loginButton = await page.$('button[type="submit"]');
    await loginButton.click();
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // Give it a moment
    const currentUrl = page.url();
    console.log('✅ Logged in, redirected to:', currentUrl, '\n');
    
    // Step 4: Check if we're on dashboard or need to verify email
    if (currentUrl.includes('verify-email')) {
      console.log('⚠️  User needs email verification first');
      console.log('   Please verify the email and try again\n');
      await browser.close();
      return;
    }
    
    // Navigate to dashboard if not there already
    if (!currentUrl.includes('dashboard')) {
      console.log('Step 4: Navigating to dashboard...');
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
    } else {
      console.log('Step 4: Already on dashboard\n');
    }
    
    // Wait a moment for the page to fully load
    await page.waitForTimeout(2000);
    
    // Step 5: Check if business setup form is visible
    console.log('Step 5: Checking page state...');
    const hasBusinessForm = await page.$('input[placeholder*="business" i], input[placeholder*="Acme" i]');
    const hasBusinessData = await page.$('text/QR Code') || await page.$('text/Share Link');
    
    if (hasBusinessForm) {
      console.log('📋 Business setup form is visible\n');
      
      // Step 6: Fill out the business form
      console.log('Step 6: Filling out business form...');
      const businessNameInput = await page.$('input[placeholder*="business" i], input[placeholder*="Acme" i]');
      if (businessNameInput) {
        await businessNameInput.click({ clickCount: 3 }); // Select all
        await businessNameInput.type('Browser Test Restaurant ' + Date.now());
        console.log('✅ Business name entered\n');
        
        // Step 7: Click save button
        console.log('Step 7: Clicking "Save and continue"...');
        const saveButton = await page.$('button[type="submit"]');
        if (saveButton) {
          await saveButton.click();
          
          // Wait for response and potential redirect
          await page.waitForTimeout(3000);
          
          // Check if form is still visible or if business data appeared
          const formStillVisible = await page.$('input[placeholder*="business" i], input[placeholder*="Acme" i]');
          const businessDataAppeared = await page.$('text/QR Code') || await page.$('text/Share Link');
          
          if (formStillVisible) {
            console.log('❌ PROBLEM: Form is still visible after save');
            
            // Check for error messages
            const errorMessage = await page.$eval('div[class*="red"], div[class*="error"]', el => el.textContent).catch(() => null);
            if (errorMessage) {
              console.log('   Error message:', errorMessage);
            }
            
            // Check console for errors
            console.log('\n📝 Checking browser console for errors...');
            const consoleLogs = [];
            page.on('console', msg => consoleLogs.push(`${msg.type()}: ${msg.text()}`));
            await page.waitForTimeout(1000);
            if (consoleLogs.length > 0) {
              console.log('   Console output:', consoleLogs.slice(-5).join('\n   '));
            }
            
          } else if (businessDataAppeared) {
            console.log('✅ SUCCESS! Business data is now visible');
            console.log('   The dashboard is showing business information instead of the form\n');
          } else {
            console.log('⏳ Page state unclear, taking screenshot for analysis...');
          }
          
        } else {
          console.log('❌ Could not find save button');
        }
      }
      
    } else if (hasBusinessData) {
      console.log('✅ Business data is already visible!');
      console.log('   The user already has a business set up\n');
      console.log('   To test the form, delete the business first or use a fresh account');
      
    } else {
      console.log('⚠️  Page state unclear');
    }
    
    // Take a screenshot for reference
    await page.screenshot({ path: '/tmp/dashboard-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to /tmp/dashboard-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 Browser test complete');
  }
}

test();
