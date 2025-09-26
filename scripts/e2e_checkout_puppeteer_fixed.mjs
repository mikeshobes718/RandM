#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const EMAIL = process.env.TEST_EMAIL || 'kukalol872@synarca.com';
const PASSWORD = process.env.TEST_PASSWORD || 'T@st2024';

const CARD = process.env.TEST_CARD || '4242424242424242';
const EXP = process.env.TEST_EXP || '1232'; // MMYY
const CVC = process.env.TEST_CVC || '123';
const ZIP = process.env.TEST_ZIP || '94107';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function goto(page, url) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { status: res?.status() || 0, url: page.url() };
}

async function login(page) {
  await goto(page, `${BASE}/login?next=%2Fpricing%3Fstripe%3Dtest`);
  await page.waitForSelector('input[aria-label="Email"]', { timeout: 30000 });
  await page.type('input[aria-label="Email"]', EMAIL, { delay: 10 });
  await page.type('input[aria-label="Password"]', PASSWORD, { delay: 10 });
  await page.click('button[type="submit"]');
  await sleep(2000);
  // Ensure cookie established
  for (let i=0;i<6;i++) {
    const ok = await page.evaluate(async () => {
      try { const r = await fetch('/api/auth/me', { cache:'no-store' }); return r.ok; } catch { return false; }
    });
    if (ok) break; await sleep(400);
  }
}

async function startCheckout(page) {
  // Go to pricing with test flag
  await goto(page, `${BASE}/pricing?stripe=test`);
  // Ask server for a checkout session directly to avoid brittle DOM clicks
  const j = await page.evaluate(async () => {
    try {
      const hasToken = Boolean(localStorage.getItem('idToken'));
      const payload = hasToken ? { plan: 'monthly' } : { plan: 'monthly', uid:'anon', email: localStorage.getItem('userEmail')||'' };
      const r = await fetch('/api/stripe/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  });
  if (!j || !j.url) throw new Error('No checkout URL');
  await goto(page, j.url);
  // Ensure on Stripe
  for (let i=0;i<60;i++) {
    if (/checkout\.stripe\.com/.test(page.url())) break;
    await sleep(250);
  }
}

async function fillStripeCheckout(page) {
  // If Link is offered, click Pay without Link
  try {
    const linkBtn = await page.locator("//a[contains(., 'Pay without Link')] | //button[contains(., 'Pay without Link')]").first();
    if (await linkBtn.isVisible()) { 
      await linkBtn.click().catch(()=>{}); 
      await sleep(800); 
    }
  } catch {}

  // Fill email if visible
  try {
    await page.type('input[type=email]', EMAIL, { delay: 10 }).catch(()=>{});
  } catch {}

  // Find iframes and try filling card fields
  // Try to fill card fields within nested iframes
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
    // Check if the Subscribe button is enabled; if not, retry scanning frames
    const ready = await page.locator("//button[not(@disabled) and (contains(., 'Subscribe') or contains(., 'Pay'))]").first();
    if (await ready.isVisible()) break;
    await sleep(500);
  }

  // Press Subscribe / Pay
  const submitCandidates = [
    "//button[contains(., 'Subscribe')]",
    "//button[contains(., 'Pay')]",
    "//button[@type='submit']",
  ];
  for (const xp of submitCandidates) {
    const el = await page.locator(xp).first();
    if (await el.isVisible()) { 
      await el.click().catch(()=>{}); 
      break; 
    }
  }

  // Wait for redirect back to site
  for (let i=0;i<160;i++) {
    const url = page.url();
    if (/reviewsandmarketing\.com\/.+/.test(url)) break;
    await sleep(500);
  }
}

async function verifyEntitlements(page) {
  // Finisher will run; wait a moment
  await sleep(2500);
  const ent = await page.evaluate(async () => {
    const r = await fetch('/api/entitlements', { cache: 'no-store' }).catch(()=>null);
    if (!r) return { pro: null, status: 0 };
    if (!r.ok) return { pro: null, status: r.status };
    return await r.json();
  });
  return ent;
}

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const out = { steps: [] };
  try {
    await login(page); out.steps.push({ login: page.url() });
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











