#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const EMAIL = process.env.TEST_EMAIL || 'wixihico31@advitise.com';
const PASSWORD = process.env.TEST_PASSWORD || 'T@st1234';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.type('input[type=email]', EMAIL);
  await page.type('input[type=password]', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {});

  const data = await page.evaluate(() => {
    const cookie = document.cookie;
    const token = localStorage.getItem('idToken');
    return { cookie, tokenLength: token?.length || 0, hasToken: Boolean(token) };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
