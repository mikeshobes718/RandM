import fetch from 'node-fetch';

const APP_URL = 'https://reviewsandmarketing.com';
const EMAIL = 'volurer295@ovbest.com';
const PASSWORD = 'T@st1234';

import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', EMAIL, { delay: 20 });
  await page.type('input[type="password"]', PASSWORD, { delay: 20 });
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  const cookies = await page.cookies();
  await browser.close();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${APP_URL}/api/plan/status`, {
    headers: { Cookie: cookieHeader },
  });
  console.log('Status code:', res.status);
  console.log('Body:', await res.text());
})();
