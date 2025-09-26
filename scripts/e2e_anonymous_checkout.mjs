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
  
  // Try to get checkout session directly without authentication
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
  console.log('Checkout session details:', j);
  await goto(page, j.url);
  
  for (let i=0;i<60;i++) {
    if (/checkout\.stripe\.com/.test(page.url())) break;
    await sleep(250);
  }
  console.log('On Stripe checkout page');
}

async function fillStripeCheckout(page) {
  console.log('Filling Stripe checkout form...');
  
  try {
    await page.type('input[type=email]', TEST_EMAIL, { delay: 10 }).catch(()=>{});
  } catch {}

  for (let attempt=0; attempt<8; attempt++) {
    const frames = page.frames();
    for (const f of frames) {
      try {
        const num = await f.$('input[name="cardnumber"], input[autocomplete="cc-number"], input[aria-label*="card number" i]');
        if (num) { await num.focus(); await num.type(CARD, { delay: 10 }); }
        const exp = await f.$('input[name="exp-date"], input[autocomplete="cc-exp"], input[aria-label*="expiration" i]');
        if (exp) { await exp.focus(); await exp.type(EXP, { delay: 10 }); }
        const cvc = await f.$('input[name="cvc"], input[autocomplete="cc-csc"], input[aria-label*="CVC" i]');
        if (cvc) { await cvc.focus(); await cvc.type(CVC, { delay: 10 }); }
        const zip = await f.$('input[name="postal"], input[autocomplete="postal-code"], input[aria-label*="ZIP" i], input[aria-label*="postal" i]');
        if (zip) { await zip.focus(); await zip.type(ZIP, { delay: 10 }); }
      } catch {}
    }
    
    const ready = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (!btn.disabled && (btn.textContent.includes('Subscribe') || btn.textContent.includes('Pay'))) {
          return true;
        }
      }
      return false;
    });
    if (ready) break;
    await sleep(500);
  }

  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (!btn.disabled && (btn.textContent.includes('Subscribe') || btn.textContent.includes('Pay'))) {
        btn.click();
        return;
      }
    }
  });

  console.log('Waiting for redirect back to site...');
  for (let i=0;i<160;i++) {
    const url = page.url();
    if (/reviewsandmarketing\.com\/.+/.test(url)) break;
    await sleep(500);
  }
  console.log('Redirected back to site');
}

async function checkPostCheckout(page) {
  console.log('Checking post-checkout page...');
  const currentUrl = page.url();
  console.log('Current URL after checkout:', currentUrl);
  
  if (currentUrl.includes('/post-checkout')) {
    console.log('On post-checkout page, checking for success indicators...');
    
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 1000),
        hasSuccessMessage: document.body.innerText.includes('success') || document.body.innerText.includes('welcome'),
        hasErrorMessage: document.body.innerText.includes('error') || document.body.innerText.includes('failed')
      };
    });
    
    console.log('Post-checkout page content:', pageContent);
    return pageContent;
  }
  
  return { currentUrl };
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
    await fillStripeCheckout(page); 
    out.steps.push({ afterStripe: page.url() });
    const postCheckout = await checkPostCheckout(page);
    out.postCheckout = postCheckout;
    out.finalUrl = page.url();
    console.log(JSON.stringify({ ok: true, out }, null, 2));
    await browser.close();
  } catch (e) {
    console.error('e2e checkout failed:', e);
    try { console.log(JSON.stringify({ ok: false, out }, null, 2)); } catch {}
    await browser.close();
    process.exit(1);
  }
}

run();











