import puppeteer from 'puppeteer';

const EMAIL = 'volurer295@ovbest.com';
const PASSWORD = 'T@st1234';

const APP_URL = 'https://reviewsandmarketing.com';

function findBadgeText() {
  const headings = Array.from(document.querySelectorAll('h1'));
  const dashboardHeading = headings.find((h) => h.textContent && h.textContent.trim().startsWith('Dashboard'));
  if (!dashboardHeading) return null;
  const container = dashboardHeading.parentElement;
  if (!container) return null;
  const spans = Array.from(container.querySelectorAll('span'));
  for (const span of spans) {
    const text = (span.textContent || '').trim();
    if (!text) continue;
    if (/(plan|loading)/i.test(text)) return text;
  }
  return null;
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  try {
    console.log('Visiting login page…');
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', EMAIL, { delay: 30 });
    await page.type('input[type="password"]', PASSWORD, { delay: 30 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'networkidle2' });
    }
    await page.waitForSelector('main');
    const badgeText = await page.evaluate(findBadgeText);
    console.log('Plan badge text:', badgeText || '(not found)');
  } catch (err) {
    console.error('Error during Puppeteer check:', err);
  } finally {
    await browser.close();
  }
})();
