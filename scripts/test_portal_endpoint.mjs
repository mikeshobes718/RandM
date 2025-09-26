import fetch from 'node-fetch';
import puppeteer from 'puppeteer';

const LOGIN_URL = process.env.LOGIN_BASE || 'https://reviewsandmarketing.com';
const TARGET_URL = process.env.TARGET_BASE || LOGIN_URL;
const PORTAL_MODE = process.env.PORTAL_MODE || '';
const EMAIL = 'volurer295@ovbest.com';
const PASSWORD = 'T@st1234';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await page.goto(`${LOGIN_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', EMAIL, { delay: 20 });
    await page.type('input[type="password"]', PASSWORD, { delay: 20 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    const cookies = await page.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const target = new URL('/api/stripe/portal', TARGET_URL);
    const normalizedMode = PORTAL_MODE.trim().toLowerCase();
    if (normalizedMode) target.searchParams.set('mode', normalizedMode);
    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(normalizedMode ? { mode: normalizedMode } : {}),
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } finally {
    await browser.close();
  }
})();
