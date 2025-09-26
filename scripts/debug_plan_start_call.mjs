#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const EMAIL = process.env.TEST_EMAIL || 'wixihico31@advitise.com';
const PASSWORD = process.env.TEST_PASSWORD || 'T@st1234';

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function clickByText(page, selector, text) {
  const handle = await page.evaluateHandle((sel, targetText) => {
    const elements = Array.from(document.querySelectorAll(sel));
    return elements.find((el) => el.textContent && el.textContent.trim().toLowerCase().includes(targetText.trim().toLowerCase())) || null;
  }, selector, text);
  if (!handle) throw new Error(`Element with text "${text}" not found for selector ${selector}`);
  await page.evaluate((el) => el.click(), handle);
}

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const responses = [];

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/plan/start')) {
      let body = null;
      try { body = await res.text(); } catch {}
      responses.push({ url, status: res.status(), body });
    }
  });

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[type=email]', { timeout: 15000 });
  await page.type('input[type=email]', EMAIL, { delay: 25 });
  await page.type('input[type=password]', PASSWORD, { delay: 25 });
  await clickByText(page, 'button', 'Sign in');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {});

  const authState = await page.evaluate(() => ({
    cookie: document.cookie,
    token: localStorage.getItem('idToken'),
  }));

  await page.goto(`${BASE}/pricing`, { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(2000);
  const hasButton = await page.evaluate(() => {
    return Boolean(Array.from(document.querySelectorAll('button')).find((el) => /activate starter/i.test(el.textContent || '')));
  });
  if (hasButton) {
    await clickByText(page, 'button', 'Activate Starter');
    await sleep(3000);
  }

  const directCall = await page.evaluate(async () => {
    try {
      const headers = {};
      try { const token = localStorage.getItem('idToken'); if (token) headers.Authorization = `Bearer ${token}`; } catch {}
      const res = await fetch('/api/plan/start', { method: 'POST', headers, credentials: 'include' });
      const text = await res.text();
      return { status: res.status, ok: res.ok, text };
    } catch (err) {
      return { status: null, ok: false, text: String(err) };
    }
  });

  console.log(JSON.stringify({ responses, directCall, authState: { cookie: authState.cookie, tokenSnippet: authState.token ? `${authState.token.slice(0,12)}...${authState.token.slice(-6)}` : null } }, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
