#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const EMAIL = process.env.SMOKE_EMAIL || 'vukiku5673@cengrop.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'T@st1234';
const SEARCH = process.env.SMOKE_PLACE_QUERY || 'Smart Fit Envigado';

async function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  const results = [];
  try {
    // Login
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type=email]');
    await page.type('input[type=email]', EMAIL, { delay: 10 });
    await page.type('input[type=password]', PASSWORD, { delay: 10 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(()=>{}),
      page.click('button[type=submit]')
    ]);
    results.push({ step: 'login->url', url: page.url() });

    // Go to onboarding if needed
    await page.goto(`${BASE}/onboarding/business`, { waitUntil: 'domcontentloaded' });
    const searchSelector = 'input[placeholder*="Smart"], input[placeholder*="search" i], input[type="search"], input[type="text"], input';
    await page.waitForSelector(searchSelector, { timeout: 60000 });
    await page.click(searchSelector);
    await page.keyboard.type(SEARCH, { delay: 20 });
    // Wait for suggestions
    await page.waitForSelector('ul li button, ul li', { timeout: 20000 }).catch(()=>{});
    // Select first suggestion
    await page.keyboard.press('Enter');
    // Brief wait for details
    await wait(1500);

    // Save and continue
    // Click a button that contains text 'Save and continue' (fallback: first submit)
    const clicked = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('button'));
      const target = all.find(b => /save\s+and\s+continue/i.test(b.textContent||'')) || document.querySelector('form button[type="submit"]');
      if (target) { (target).click(); return true; }
      return false;
    });
    if (clicked) await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(()=>{});
    await wait(3000);
    results.push({ step: 'post-save-url', url: page.url() });

    // Check dashboard
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    const body = await page.evaluate(() => document.body.innerText || '');
    const hasNoBiz = /No business connected/i.test(body);
    results.push({ step: 'dashboard-check', hasNoBiz });
    if (hasNoBiz) throw new Error('Business not connected after save');

    console.log(JSON.stringify({ ok: true, results }, null, 2));
    await browser.close();
  } catch (e) {
    console.error('Full onboarding smoke failed:', e);
    try { console.log(JSON.stringify({ ok: false, results }, null, 2)); } catch {}
    await browser.close();
    process.exit(1);
  }
}

run();
