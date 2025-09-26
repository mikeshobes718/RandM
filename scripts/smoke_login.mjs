#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const EMAIL = process.env.SMOKE_EMAIL || 'vukiku5673@cengrop.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'T@st1234';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const results = [];
  try {
    // Login
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('input[type=email]');
    await page.type('input[type=email]', EMAIL, { delay: 10 });
    await page.type('input[type=password]', PASSWORD, { delay: 10 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(()=>{}),
      page.click('button[type=submit]')
    ]);
    const urlAfter = page.url();
    results.push({ step: 'login', url: urlAfter });

    // If user has no business, dashboard should redirect to onboarding
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const afterDash = page.url();
    results.push({ step: 'dashboard-redirect', url: afterDash });

    // Either on onboarding or dashboard; assert page exists
    if (!/onboarding\/business|dashboard/.test(afterDash)) throw new Error('Unexpected post-login destination');

    // Header should include Dashboard button when business exists; otherwise Connect business is visible
    const bodyText = await page.evaluate(() => document.body.innerText || '');
    results.push({ hasDashboardCta: /Dashboard/.test(bodyText) });

    console.log(JSON.stringify({ ok: true, results }, null, 2));
    await browser.close();
  } catch (e) {
    console.error('Smoke login failed:', e);
    try { console.log(JSON.stringify({ ok: false, results }, null, 2)); } catch {}
    await browser.close();
    process.exit(1);
  }
}

run();

