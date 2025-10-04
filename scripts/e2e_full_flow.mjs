#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const TEST_EMAIL = process.env.TEST_EMAIL || `test-${Date.now()}@example.com`;
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';

const CARD = process.env.TEST_CARD || '4242424242424242';
const EXP = process.env.TEST_EXP || '1232'; // MMYY
const CVC = process.env.TEST_CVC || '123';
const ZIP = process.env.TEST_ZIP || '94107';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function goto(page, url) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { status: res?.status() || 0, url: page.url() };
}

async function register(page) {
  console.log(`Registering new user: ${TEST_EMAIL}`);
  await goto(page, `${BASE}/register`);
  await page.waitForSelector('input[type=email]', { timeout: 30000 });
  await page.type('input[type=email]', TEST_EMAIL, { delay: 10 });
  await page.type('input[type=password]', TEST_PASSWORD, { delay: 10 });
  await page.click('button[type="submit"]');
  await sleep(3000);
  
  // Check if we're on verify-email page
  const currentUrl = page.url();
  console.log('Current URL after registration:', currentUrl);
  
  if (currentUrl.includes('/verify-email')) {
    console.log('On verify-email page, clicking "I verified" button...');
    await page.waitForSelector('button:has-text("I verified")', { timeout: 10000 });
    await page.click('button:has-text("I verified")');
    await sleep(2000);
  }
  
  // Check auth status after verification
  const authStatus = await page.evaluate(async () => {
    try { 
      const r = await fetch('/api/auth/me', { cache:'no-store' }); 
      return { ok: r.ok, status: r.status };
    } catch (e) { 
      return { ok: false, error: e.message };
    }
  });
  console.log('Auth status after verification:', authStatus);
  
  console.log('Registration and verification completed');
}

async function startCheckout(page) {
  console.log('Starting checkout process...');
  // Go to pricing with test flag
  await goto(page, `${BASE}/pricing?stripe=test`);
  
  // Check auth status before checkout
  const authStatus = await page.evaluate(async () => {
    try { 
      const r = await fetch('/api/auth/me', { cache:'no-store' }); 
      return { ok: r.ok, status: r.status };
    } catch (e) { 
      return { ok: false, error: e.message };
    }
  });
  console.log('Auth status before checkout:', authStatus);
  
  // Ask server for a checkout session directly to avoid brittle DOM clicks
  const j = await page.evaluate(async () => {
    try {
      const hasToken = Boolean(localStorage.getItem('idToken'));
      const payload = hasToken ? { plan: 'monthly' } : { plan: 'monthly', uid:'anon', email: localStorage.getItem('userEmail')||'' };
      const r = await fetch('/api/stripe/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
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
  // Ensure on Stripe
  for (let i=0;i<60;i++) {
    if (/checkout\.stripe\.com/.test(page.url())) break;
    await sleep(250);
  }
  console.log('On Stripe checkout page');
}

async function fillStripeCheckout(page) {
  console.log('Filling Stripe checkout form...');
  
  // Fill email if visible
  try {
    await page.type('input[type=email]', TEST_EMAIL, { delay: 10 }).catch(()=>{});
  } catch {}

  // Find iframes and try filling card fields
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
    // Check if the Subscribe button is enabled using a simpler approach
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

  // Press Subscribe / Pay using evaluate
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (!btn.disabled && (btn.textContent.includes('Subscribe') || btn.textContent.includes('Pay'))) {
        btn.click();
        return;
      }
    }
  });

  // Wait for redirect back to site
  console.log('Waiting for redirect back to site...');
  for (let i=0;i<160;i++) {
    const url = page.url();
    if (/reviewsandmarketing\.com\/.+/.test(url)) break;
    await sleep(500);
  }
  console.log('Redirected back to site');
}

async function verifyEntitlements(page) {
  console.log('Verifying entitlements...');
  
  // Check auth status before checking entitlements
  const authStatus = await page.evaluate(async () => {
    try { 
      const r = await fetch('/api/auth/me', { cache:'no-store' }); 
      return { ok: r.ok, status: r.status };
    } catch (e) { 
      return { ok: false, error: e.message };
    }
  });
  console.log('Auth status before entitlements check:', authStatus);
  
  // Finisher will run; wait a moment
  await sleep(2500);
  const ent = await page.evaluate(async () => {
    const r = await fetch('/api/entitlements', { cache: 'no-store' }).catch(()=>null);
    if (!r) return { pro: null, status: 0 };
    if (!r.ok) return { pro: null, status: r.status };
    return await r.json();
  });
  console.log('Entitlements:', ent);
  return ent;
}

async function run() {
  const browser = await puppeteer.launch({ 
    headless: 'new', // Run headless for automation
    args: ['--no-sandbox'] 
  });
  const page = await browser.newPage();
  const out = { steps: [], testEmail: TEST_EMAIL };
  try {
    await register(page); out.steps.push({ register: page.url() });
    await startCheckout(page); out.steps.push({ stripe: page.url() });
    await fillStripeCheckout(page); out.steps.push({ afterStripe: page.url() });
    const ent = await verifyEntitlements(page);
    out.entitlements = ent;
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














