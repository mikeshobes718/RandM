#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
// Use a real email address that can receive verification emails
const TEST_EMAIL = process.env.TEST_EMAIL || 'mikeshobes718@yahoo.com';
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
  
  // Clear any existing values
  await page.evaluate(() => {
    const emailInput = document.querySelector('input[type=email]');
    const passwordInput = document.querySelector('input[type=password]');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
  });
  
  await page.type('input[type=email]', TEST_EMAIL, { delay: 10 });
  await page.type('input[type=password]', TEST_PASSWORD, { delay: 10 });
  
  await page.click('button[type="submit"]');
  await sleep(3000);
  
  const currentUrl = page.url();
  console.log('Current URL after registration:', currentUrl);
  
  if (currentUrl.includes('/verify-email')) {
    console.log('On verify-email page. Please check your email and click the verification link.');
    console.log('Waiting for manual verification...');
    
    // Wait for user to manually verify email
    for (let i = 0; i < 60; i++) {
      const authStatus = await page.evaluate(async () => {
        try { 
          const r = await fetch('/api/auth/me', { cache:'no-store' }); 
          return { ok: r.ok, status: r.status };
        } catch (e) { 
          return { ok: false, error: e.message };
        }
      });
      
      if (authStatus.ok) {
        console.log('Email verified successfully!');
        break;
      }
      
      console.log(`Waiting for verification... (${i+1}/60)`);
      await sleep(1000);
    }
  }
  
  // Check final auth status
  const authStatus = await page.evaluate(async () => {
    try { 
      const r = await fetch('/api/auth/me', { cache:'no-store' }); 
      return { ok: r.ok, status: r.status };
    } catch (e) { 
      return { ok: false, error: e.message };
    }
  });
  console.log('Final auth status:', authStatus);
  
  return authStatus;
}

async function startCheckout(page) {
  console.log('Starting checkout process...');
  await goto(page, `${BASE}/pricing?stripe=test`);
  
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

async function verifyEntitlements(page) {
  console.log('Verifying entitlements...');
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
    headless: false, // Run in visible mode so you can see what's happening
    args: ['--no-sandbox', '--window-size=1200,800'] 
  });
  const page = await browser.newPage();
  const out = { steps: [], testEmail: TEST_EMAIL };
  
  try {
    const authStatus = await register(page); 
    out.steps.push({ register: page.url(), authStatus });
    
    if (!authStatus.ok) {
      console.log('Authentication failed, cannot proceed with checkout');
      out.error = 'Authentication failed';
      console.log(JSON.stringify({ ok: false, out }, null, 2));
      await browser.close();
      return;
    }
    
    await startCheckout(page); 
    out.steps.push({ stripe: page.url() });
    await fillStripeCheckout(page); 
    out.steps.push({ afterStripe: page.url() });
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











