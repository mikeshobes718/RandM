#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const EMAIL = process.env.TEST_EMAIL || 'wixihico31@advitise.com';
const PASSWORD = process.env.TEST_PASSWORD || 'T@st1234';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.type('input[type=email]', EMAIL, { delay: 20 });
  await page.type('input[type=password]', PASSWORD, { delay: 20 });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((el) => /sign in/i.test(el.textContent || ''));
    if (btn instanceof HTMLButtonElement) {
      btn.click();
    } else if (btn) {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {});

  const statusResult = await page.evaluate(async () => {
    try {
      const headers = {};
      try { const token = localStorage.getItem('idToken'); if (token) headers.Authorization = `Bearer ${token}`; } catch {}
      const res = await fetch('/api/plan/status', { credentials: 'include', headers });
      const text = await res.text();
      return { status: res.status, text };
    } catch (err) {
      return { status: null, text: String(err) };
    }
  });
  console.log(JSON.stringify(statusResult, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
