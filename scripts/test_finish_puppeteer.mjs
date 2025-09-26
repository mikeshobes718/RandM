#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const EMAIL = process.env.TEST_EMAIL || 'kukalol872@synarca.com';
const PASSWORD = process.env.TEST_PASSWORD || 'T@st1234';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function goto(page, url) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { status: res?.status() || 0, url: page.url() };
}

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const out = { steps: [], pro: null };
  try {
    // Login
    out.steps.push(await goto(page, `${BASE}/login?next=%2Fpost-checkout%2Ffinish`));
    await page.waitForSelector('input[aria-label="Email"]');
    await page.type('input[aria-label="Email"]', EMAIL, { delay: 10 });
    await page.type('input[aria-label="Password"]', PASSWORD, { delay: 10 });
    // Click the form submit button
    await page.click('button[type="submit"]');
    await sleep(3000);
    let bodyText = await page.evaluate(()=>document.body.innerText || '');
    out.steps.push({ afterLogin: page.url(), bodyPreview: bodyText.slice(0,200) });
    if (/auth\/invalid-credential/i.test(bodyText)) {
      // Try registration path
      out.steps.push({ note: 'login invalid, attempting register' });
      await goto(page, `${BASE}/register`);
      await page.waitForSelector('input[aria-label="Email"]');
      await page.type('input[aria-label="Email"]', EMAIL, { delay: 10 });
      await page.type('input[aria-label="Password"]', PASSWORD, { delay: 10 });
      await page.click('button[type="submit"]');
      // Wait for any navigation or message
      await sleep(1500);
      // Establish cookie explicitly using the client idToken when present
      try {
        const tok = await page.evaluate(() => localStorage.getItem('idToken'));
        if (tok) {
          await page.evaluate(async (t) => {
            await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ idToken: t, days: 7 }), credentials: 'include' });
          }, tok);
        }
      } catch {}
      out.steps.push({ afterRegister: page.url() });
    }
    // Give the client a moment to set the cookie
    await sleep(1500);

    // Attempt finisher
    out.steps.push(await goto(page, `${BASE}/post-checkout/finish`));
    // Wait briefly for auto redirect
    await sleep(3000);
    const url1 = page.url();
    const diag = await page.evaluate(async () => {
      try {
        const tok = localStorage.getItem('idToken');
        const me = await fetch('/api/auth/me', { cache: 'no-store' });
        return { hasIdToken: Boolean(tok), authMe: me.status };
      } catch { return { hasIdToken:false, authMe:0 }; }
    });
    out.steps.push({ diag });
    // If not on dashboard, hit claim/latest manually in this session
    if (!/\/dashboard/.test(url1)) {
      const res = await page.goto(`${BASE}/api/stripe/claim/latest?mode=test&email=${encodeURIComponent(EMAIL)}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(()=>null);
      out.steps.push({ latestClaimStatus: res?.status() || 0, latestClaimUrl: page.url() });
      // Go to dashboard
      await goto(page, `${BASE}/dashboard`);
    }
    // Check entitlements
    const ent = await page.evaluate(async () => {
      const r = await fetch('/api/entitlements', { cache: 'no-store' });
      const j = r.ok ? await r.json() : { pro: null, status: r.status };
      return j;
    }).catch(()=>({ pro: null }));
    out.pro = ent?.pro ?? null;
    out.finalUrl = page.url();
    console.log(JSON.stringify({ ok: true, out }, null, 2));
    await browser.close();
  } catch (e) {
    console.error('puppeteer test failed:', e);
    try { console.log(JSON.stringify({ ok: false, out }, null, 2)); } catch {}
    await browser.close();
    process.exit(1);
  }
}

run();
