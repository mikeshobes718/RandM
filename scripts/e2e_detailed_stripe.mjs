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

async function analyzeStripePage(page) {
  console.log('Analyzing Stripe checkout page...');
  
  const pageInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
      text: btn.textContent.trim(),
      disabled: btn.disabled,
      visible: btn.offsetParent !== null
    }));
    
    const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
      type: input.type,
      name: input.name,
      placeholder: input.placeholder,
      value: input.value,
      visible: input.offsetParent !== null
    }));
    
    const frames = window.frames.length;
    
    return {
      title: document.title,
      url: window.location.href,
      buttons,
      inputs,
      frameCount: frames,
      bodyText: document.body.innerText.substring(0, 500)
    };
  });
  
  console.log('Stripe page info:', JSON.stringify(pageInfo, null, 2));
  return pageInfo;
}

async function fillStripeCheckout(page) {
  console.log('Filling Stripe checkout form...');
  
  // First analyze the page
  await analyzeStripePage(page);
  
  // Fill email if visible
  try {
    await page.type('input[type=email]', TEST_EMAIL, { delay: 10 }).catch(()=>{});
    console.log('Filled email field');
  } catch (e) {
    console.log('Could not fill email field:', e.message);
  }

  // Try to fill card fields in iframes
  let fieldsFilled = 0;
  for (let attempt=0; attempt<10; attempt++) {
    console.log(`Attempt ${attempt + 1} to fill card fields...`);
    const frames = page.frames();
    console.log(`Found ${frames.length} frames`);
    
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      try {
        const num = await f.$('input[name="cardnumber"], input[autocomplete="cc-number"], input[aria-label*="card number" i]');
        if (num) { 
          await num.focus(); 
          await num.type(CARD, { delay: 10 }); 
          console.log('Filled card number');
          fieldsFilled++;
        }
        
        const exp = await f.$('input[name="exp-date"], input[autocomplete="cc-exp"], input[aria-label*="expiration" i]');
        if (exp) { 
          await exp.focus(); 
          await exp.type(EXP, { delay: 10 }); 
          console.log('Filled expiration');
          fieldsFilled++;
        }
        
        const cvc = await f.$('input[name="cvc"], input[autocomplete="cc-csc"], input[aria-label*="CVC" i]');
        if (cvc) { 
          await cvc.focus(); 
          await cvc.type(CVC, { delay: 10 }); 
          console.log('Filled CVC');
          fieldsFilled++;
        }
        
        const zip = await f.$('input[name="postal"], input[autocomplete="postal-code"], input[aria-label*="ZIP" i], input[aria-label*="postal" i]');
        if (zip) { 
          await zip.focus(); 
          await zip.type(ZIP, { delay: 10 }); 
          console.log('Filled ZIP');
          fieldsFilled++;
        }
      } catch (e) {
        console.log(`Error filling fields in frame ${i}:`, e.message);
      }
    }
    
    // Check if the Subscribe button is enabled
    const ready = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (!btn.disabled && (btn.textContent.includes('Subscribe') || btn.textContent.includes('Pay'))) {
          return { ready: true, buttonText: btn.textContent.trim() };
        }
      }
      return { ready: false, buttonText: 'none' };
    });
    
    console.log(`Fields filled: ${fieldsFilled}, Button ready: ${ready.ready}, Button text: ${ready.buttonText}`);
    
    if (ready.ready) break;
    await sleep(1000);
  }

  // Try to submit the form
  console.log('Attempting to submit the form...');
  const submitResult = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (!btn.disabled && (btn.textContent.includes('Subscribe') || btn.textContent.includes('Pay'))) {
        btn.click();
        return { clicked: true, buttonText: btn.textContent.trim() };
      }
    }
    return { clicked: false, buttonText: 'none' };
  });
  
  console.log('Submit result:', submitResult);

  // Wait and check for redirect
  console.log('Waiting for redirect back to site...');
  for (let i=0;i<60;i++) {
    const url = page.url();
    console.log(`Waiting... (${i+1}/60) Current URL: ${url}`);
    if (/reviewsandmarketing\.com\/.+/.test(url)) {
      console.log('Successfully redirected back to site!');
      break;
    }
    await sleep(1000);
  }
  
  const finalUrl = page.url();
  console.log('Final URL after checkout:', finalUrl);
  return finalUrl;
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
    
    const finalUrl = await fillStripeCheckout(page); 
    out.steps.push({ afterStripe: finalUrl });
    
    out.finalUrl = finalUrl;
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











