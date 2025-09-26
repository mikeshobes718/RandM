import puppeteer from 'puppeteer';

const EMAIL = 'volurer295@ovbest.com';
const PASSWORD = 'T@st1234';
const APP_URL = 'https://reviewsandmarketing.com';

async function runCheck(iteration) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  const results = { iteration };
  try {
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', EMAIL, { delay: 20 });
    await page.type('input[type="password"]', PASSWORD, { delay: 20 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'networkidle2' });
    }
    await page.waitForSelector('main');

    const data = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };
      const heading = getText('h1');
      let planBadge = null;
      const headingWrapper = document.querySelector('h1')?.parentElement;
      if (headingWrapper) {
        const badgeEl = Array.from(headingWrapper.querySelectorAll('span')).find(span => /plan/i.test(span.textContent || ''));
        planBadge = badgeEl ? badgeEl.textContent.trim() : null;
      }
      const buttons = Array.from(document.querySelectorAll('a, button')).map(el => el.textContent ? el.textContent.trim() : '');
      const banner = Array.from(document.querySelectorAll('div')).map(el => el.textContent ? el.textContent.trim() : '').find(text => text.includes('Starter plan'));
      const textIndex = (needle) => Array.from(document.querySelectorAll('div, span, p')).some(el => (el.textContent || '').trim().includes(needle));
      const summaryChecks = {
        googleRating: textIndex('Google Rating'),
        reviewsThisMonth: textIndex('Reviews this month'),
        shareLinkScans: textIndex('Share link scans'),
      };
      const businessNameEl = Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('Smart Fit'));
      const businessName = businessNameEl ? businessNameEl.textContent.trim() : null;
      const googleInputEl = Array.from(document.querySelectorAll('input')).find(input => (input.value || '').includes('search.google.com/local/writereview'));
      const landingInputEl = Array.from(document.querySelectorAll('input')).find(input => (input.value || '').includes('reviewsandmarketing.com/r/'));
      const googleInput = googleInputEl ? googleInputEl.value : null;
      const landingInput = landingInputEl ? landingInputEl.value : null;
      const qrImgEl = document.querySelector('img[alt="QR to review link"]');
      const qrImg = qrImgEl ? qrImgEl.getAttribute('src') : null;
      return { heading, planBadge, buttons, banner, summaryChecks, businessName, googleInput, qrImg, landingInput };
    });
    results.data = data;
  } catch (error) {
    results.error = error.message;
  } finally {
    await page.deleteCookie(...await page.cookies());
    await browser.close();
  }
  return results;
}

(async () => {
  const attempts = [];
  for (let i = 1; i <= 3; i++) {
    const result = await runCheck(i);
    attempts.push(result);
    console.log('Attempt', i, JSON.stringify(result, null, 2));
  }
})();
