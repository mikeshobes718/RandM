import puppeteer from 'puppeteer';
const APP_URL = 'https://reviewsandmarketing.com';
const EMAIL = 'volurer295@ovbest.com';
const PASSWORD = 'T@st1234';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  const cookies = await page.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${APP_URL}/api/auth/me`, { headers: { Cookie: cookieHeader } });
  console.log('status', res.status);
  console.log('body', await res.text());
  await browser.close();
})();
