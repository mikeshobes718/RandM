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
  
  // Wait for Stripe to fully load
  await sleep(3000);
  
  // Wait for iframes to be available
  await page.waitForFunction(() => {
    return window.frames.length > 0;
  }, { timeout: 10000 });
  
  console.log(`Found ${page.frames().length} frames`);
}

async function fillStripeFields(page) {
  console.log('Filling Stripe checkout form...');
  
  // Fill email if visible
  try {
    await page.type('input[type=email]', TEST_EMAIL, { delay: 10 }).catch(()=>{});
    console.log('Filled email field');
  } catch (e) {
    console.log('Could not fill email field:', e.message);
  }

  // Wait for Stripe elements to load
  await waitForStripeElements(page);

  // Try multiple approaches to fill card fields
  let fieldsFilled = 0;
  const maxAttempts = 15;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Attempt ${attempt + 1}/${maxAttempts} to fill card fields...`);
    
    const frames = page.frames();
    console.log(`Scanning ${frames.length} frames...`);
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      try {
        // Try multiple selectors for card number
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
              await cardInput.focus();
              await cardInput.click();
              await cardInput.type(CARD, { delay: 50 });
              console.log(`✓ Filled card number with selector: ${selector}`);
              fieldsFilled++;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Try multiple selectors for expiration
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
              await expInput.focus();
              await expInput.click();
              await expInput.type(EXP, { delay: 50 });
              console.log(`✓ Filled expiration with selector: ${selector}`);
              fieldsFilled++;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Try multiple selectors for CVC
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
              await cvcInput.focus();
              await cvcInput.click();
              await cvcInput.type(CVC, { delay: 50 });
              console.log(`✓ Filled CVC with selector: ${selector}`);
              fieldsFilled++;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Try multiple selectors for ZIP
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
              await zipInput.focus();
              await zipInput.click();
              await zipInput.type(ZIP, { delay: 50 });
              console.log(`✓ Filled ZIP with selector: ${selector}`);
              fieldsFilled++;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
      } catch (e) {
        console.log(`Error in frame ${i}:`, e.message);
      }
    }
    
    // Check if we have enough fields filled
    if (fieldsFilled >= 3) {
      console.log(`✓ Successfully filled ${fieldsFilled} fields`);
      break;
    }
    
    // Wait a bit before next attempt
    await sleep(1000);
  }
  
  console.log(`Total fields filled: ${fieldsFilled}`);
  return fieldsFilled;
}

async function submitStripeForm(page) {
  console.log('Submitting Stripe form...');
  
  // Wait for submit button to be ready
  await sleep(2000);
  
  // Try multiple approaches to find and click submit button
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Subscribe")',
    'button:has-text("Pay")',
    'button:has-text("Complete")',
    'button[data-testid*="submit"]',
    'button[aria-label*="submit" i]'
  ];
  
  for (const selector of submitSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        const isEnabled = await page.evaluate(el => !el.disabled, button);
        if (isEnabled) {
          await button.click();
          console.log(`✓ Clicked submit button with selector: ${selector}`);
          return true;
        }
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  
  // Fallback: try clicking any enabled button
  const anyButton = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (!btn.disabled && (btn.textContent.includes('Subscribe') || btn.textContent.includes('Pay') || btn.textContent.includes('Complete'))) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  
  if (anyButton) {
    console.log('✓ Clicked submit button via fallback method');
    return true;
  }
  
  console.log('❌ Could not find or click submit button');
  return false;
}

async function waitForRedirect(page) {
  console.log('Waiting for redirect back to site...');
  
  for (let i = 0; i < 120; i++) {
    const url = page.url();
    console.log(`Waiting... (${i+1}/120) Current URL: ${url.substring(0, 100)}...`);
    
    if (/reviewsandmarketing\.com\/.+/.test(url)) {
      console.log('✅ Successfully redirected back to site!');
      return url;
    }
    
    // Check if we're on a success page
    if (url.includes('/post-checkout') || url.includes('/success') || url.includes('/thank-you')) {
      console.log('✅ Reached success page!');
      return url;
    }
    
    await sleep(1000);
  }
  
  console.log('❌ Timeout waiting for redirect');
  return page.url();
}

async function run() {
  const browser = await puppeteer.launch({ 
    headless: false, // Run in visible mode so you can see what's happening
    args: ['--no-sandbox', '--window-size=1200,800'] 
  });
  const page = await browser.newPage();
  const out = { steps: [], testEmail: TEST_EMAIL };
  
  try {
    await startAnonymousCheckout(page); 
    out.steps.push({ checkout: page.url() });
    
    const fieldsFilled = await fillStripeFields(page);
    out.fieldsFilled = fieldsFilled;
    
    if (fieldsFilled < 2) {
      console.log('❌ Not enough fields filled, cannot proceed');
      out.error = 'Failed to fill required fields';
      console.log(JSON.stringify({ ok: false, out }, null, 2));
      await browser.close();
      return;
    }
    
    const submitted = await submitStripeForm(page);
    out.submitted = submitted;
    
    const finalUrl = await waitForRedirect(page);
    out.steps.push({ afterStripe: finalUrl });
    out.finalUrl = finalUrl;
    
    // Check if we reached a success page
    const isSuccess = finalUrl.includes('/post-checkout') || 
                     finalUrl.includes('/success') || 
                     finalUrl.includes('/thank-you') ||
                     finalUrl.includes('reviewsandmarketing.com');
    
    out.success = isSuccess;
    
    console.log(JSON.stringify({ ok: true, out }, null, 2));
    
    // Keep browser open for inspection
    console.log('Keeping browser open for 30 seconds to inspect...');
    await sleep(30000);
    await browser.close();
  } catch (e) {
    console.error('e2e checkout failed:', e);
    try { console.log(JSON.stringify({ ok: false, out }, null, 2)); } catch {}
    await browser.close();
    process.exit(1);
  }
}

run();











