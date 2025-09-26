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
    if (btn instanceof HTMLButtonElement) btn.click();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {});

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle0', timeout: 60000 });
  const title = await page.title();
  const path = new URL(page.url()).pathname + new URL(page.url()).search;
  const planBadge = await page.evaluate(() => {
    const badge = document.querySelector('[class*="rounded-full"][class*="font-semibold"]');
    return badge ? badge.textContent?.trim() : null;
  });

  console.log(JSON.stringify({ url: page.url(), path, title, planBadge }, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
