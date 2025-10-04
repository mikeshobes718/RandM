#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const TEST_EMAIL = process.env.TEST_EMAIL || 'tugereyu58@ramcen.com';

const CARD = process.env.TEST_CARD || '4242424242424242';
const EXP = process.env.TEST_EXP || '1232'; // MMYY
const CVC = process.env.TEST_CVC || '123';
const ZIP = process.env.TEST_ZIP || '94107';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function goto(page, url) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { status: res?.status() || 0, url: page.url() };
}

async function startAnonymousCheckout(page) {
  console.log('Starting anonymous checkout process...');
  await goto(page, `${BASE}/pricing?stripe=test`);
  
  const j = await page.evaluate(async () => {
    try {
      const payload = { plan: 'monthly', uid: 'anon', email: 'tugereyu58@ramcen.com' };
      const r = await fetch('/api/stripe/checkout', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!r.ok) {
        const error = await r.text();
        return { error, status: r.status };
      }
      return await r.json();
    } catch (e) { 
      return { error: e.message };
    }
  });
  
  if (j.error) {
    console.log('Checkout API error:', j);
    throw new Error(`Checkout failed: ${j.error}`);
  }
  
  if (!j || !j.url) throw new Error('No checkout URL');
  console.log('Got checkout URL, navigating to Stripe...');
  await goto(page, j.url);
  
  for (let i=0;i<60;i++) {
    if (/checkout\.stripe\.com/.test(page.url())) break;
    await sleep(250);
  }
  console.log('On Stripe checkout page');
}

async function waitForStripeElements(page) {
  console.log('Waiting for Stripe elements to load...');
  await sleep(3000);
  await page.waitForFunction(() => window.frames.length > 0, { timeout: 10000 });
  console.log(`Found ${page.frames().length} frames`);
}

async function fillAllStripeFields(page) {
  console.log('Filling ALL Stripe checkout fields...');
  
  // Fill email
  try {
    await page.type('input[type=email]', TEST_EMAIL, { delay: 10 });
    console.log('✓ Filled email field');
  } catch (e) {
    console.log('Could not fill email field:', e.message);
  }

  await waitForStripeElements(page);

  let fieldsFilled = 0;
  const maxAttempts = 20;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`\n--- Attempt ${attempt + 1}/${maxAttempts} ---`);
    
    const frames = page.frames();
    let attemptFieldsFilled = 0;
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      try {
        // Card Number - try multiple selectors
        const cardSelectors = [
          'input[name="cardnumber"]',
          'input[autocomplete="cc-number"]',
          'input[aria-label*="card number" i]',
          'input[placeholder*="card" i]',
          'input[data-testid*="card" i]',
          'input[id*="card" i]',
          'input[type="tel"]'
        ];
        
        for (const selector of cardSelectors) {
          try {
            const cardInput = await frame.$(selector);
            if (cardInput) {
              const currentValue = await cardInput.evaluate(el => el.value);
              if (!currentValue || currentValue.length < 16) {
                await cardInput.focus();
                await cardInput.click();
                await cardInput.evaluate(el => el.value = ''); // Clear first
                await cardInput.type(CARD, { delay: 30 });
                console.log(`✓ Card number filled with: ${selector}`);
                attemptFieldsFilled++;
                break;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Expiration - try multiple selectors
        const expSelectors = [
          'input[name="exp-date"]',
          'input[autocomplete="cc-exp"]',
          'input[aria-label*="expiration" i]',
          'input[placeholder*="exp" i]',
          'input[placeholder*="MM" i]',
          'input[data-testid*="exp" i]'
        ];
        
        for (const selector of expSelectors) {
          try {
            const expInput = await frame.$(selector);
            if (expInput) {
              const currentValue = await expInput.evaluate(el => el.value);
              if (!currentValue || currentValue.length < 4) {
                await expInput.focus();
                await expInput.click();
                await expInput.evaluate(el => el.value = ''); // Clear first
                await expInput.type(EXP, { delay: 30 });
                console.log(`✓ Expiration filled with: ${selector}`);
                attemptFieldsFilled++;
                break;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // CVC - try multiple selectors
        const cvcSelectors = [
          'input[name="cvc"]',
          'input[autocomplete="cc-csc"]',
          'input[aria-label*="CVC" i]',
          'input[placeholder*="CVC" i]',
          'input[placeholder*="CVV" i]',
          'input[data-testid*="cvc" i]'
        ];
        
        for (const selector of cvcSelectors) {
          try {
            const cvcInput = await frame.$(selector);
            if (cvcInput) {
              const currentValue = await cvcInput.evaluate(el => el.value);
              if (!currentValue || currentValue.length < 3) {
                await cvcInput.focus();
                await cvcInput.click();
                await cvcInput.evaluate(el => el.value = ''); // Clear first
                await cvcInput.type(CVC, { delay: 30 });
                console.log(`✓ CVC filled with: ${selector}`);
                attemptFieldsFilled++;
                break;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // ZIP/Postal - try multiple selectors
        const zipSelectors = [
          'input[name="postal"]',
          'input[autocomplete="postal-code"]',
          'input[aria-label*="ZIP" i]',
          'input[aria-label*="postal" i]',
          'input[placeholder*="ZIP" i]',
          'input[placeholder*="postal" i]',
          'input[data-testid*="postal" i]'
        ];
        
        for (const selector of zipSelectors) {
          try {
            const zipInput = await frame.$(selector);
            if (zipInput) {
              const currentValue = await zipInput.evaluate(el => el.value);
              if (!currentValue || currentValue.length < 5) {
                await zipInput.focus();
                await zipInput.click();
                await zipInput.evaluate(el => el.value = ''); // Clear first
                await zipInput.type(ZIP, { delay: 30 });
                console.log(`✓ ZIP filled with: ${selector}`);
                attemptFieldsFilled++;
                break;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
      } catch (e) {
        console.log(`Error in frame ${i}:`, e.message);
      }
    }
    
    fieldsFilled += attemptFieldsFilled;
    console.log(`Fields filled this attempt: ${attemptFieldsFilled}, Total: ${fieldsFilled}`);
    
    if (fieldsFilled >= 4) {
      console.log(`✅ Successfully filled all required fields (${fieldsFilled})`);
      break;
    }
    
    await sleep(1000);
  }
  
  console.log(`\nTotal fields filled: ${fieldsFilled}`);
  return fieldsFilled;
}

async function submitAndWait(page) {
  console.log('\nSubmitting Stripe form...');
  
  // Wait a moment for any validation to complete
  await sleep(2000);
  
  // Try to submit
  const submitResult = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (!btn.disabled && (btn.textContent.includes('Subscribe') || btn.textContent.includes('Pay') || btn.textContent.includes('Complete'))) {
        btn.click();
        return { clicked: true, buttonText: btn.textContent.trim() };
      }
    }
    return { clicked: false, buttonText: 'none' };
  });
  
  console.log('Submit result:', submitResult);
  
  if (!submitResult.clicked) {
    console.log('❌ Could not find submit button');
    return false;
  }
  
  // Wait for processing and redirect
  console.log('\nWaiting for payment processing and redirect...');
  
  for (let i = 0; i < 180; i++) { // 3 minutes max
    const url = page.url();
    const progress = Math.floor((i / 180) * 100);
    
    if (i % 10 === 0) { // Log every 10 seconds
      console.log(`[${progress}%] Waiting... Current URL: ${url.substring(0, 80)}...`);
    }
    
    // Check for success indicators
    if (/reviewsandmarketing\.com\/.+/.test(url)) {
      console.log('✅ Successfully redirected back to site!');
      return { success: true, url };
    }
    
    if (url.includes('/post-checkout') || url.includes('/success') || url.includes('/thank-you')) {
      console.log('✅ Reached success page!');
      return { success: true, url };
    }
    
    // Check for error indicators
    if (url.includes('/error') || url.includes('/failed') || url.includes('/cancel')) {
      console.log('❌ Payment failed or was cancelled');
      return { success: false, url, error: 'Payment failed' };
    }
    
    // Check if we're still on Stripe but with a different session (might indicate success)
    if (url.includes('checkout.stripe.com') && !url.includes('cs_test_')) {
      console.log('✅ Stripe session completed, checking for redirect...');
      await sleep(2000); // Give it a moment to redirect
      continue;
    }
    
    await sleep(1000);
  }
  
  console.log('❌ Timeout waiting for redirect');
  return { success: false, url: page.url(), error: 'Timeout' };
}

async function run() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--window-size=1200,800'] 
  });
  const page = await browser.newPage();
  const out = { steps: [], testEmail: TEST_EMAIL };
  
  try {
    await startAnonymousCheckout(page); 
    out.steps.push({ checkout: page.url() });
    
    const fieldsFilled = await fillAllStripeFields(page);
    out.fieldsFilled = fieldsFilled;
    
    if (fieldsFilled < 3) {
      console.log('❌ Not enough fields filled, cannot proceed');
      out.error = 'Failed to fill required fields';
      console.log(JSON.stringify({ ok: false, out }, null, 2));
      await browser.close();
      return;
    }
    
    const result = await submitAndWait(page);
    out.submitResult = result;
    out.finalUrl = page.url();
    out.success = result.success;
    
    console.log('\n' + '='.repeat(50));
    console.log('FINAL RESULT:', JSON.stringify({ ok: true, out }, null, 2));
    console.log('='.repeat(50));
    
    // Keep browser open for inspection
    console.log('\nKeeping browser open for 60 seconds to inspect...');
    await sleep(60000);
    await browser.close();
  } catch (e) {
    console.error('e2e checkout failed:', e);
    try { console.log(JSON.stringify({ ok: false, out }, null, 2)); } catch {}
    await browser.close();
    process.exit(1);
  }
}

run();














