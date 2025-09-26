import puppeteer from 'puppeteer';

const EMAIL = 'volurer295@ovbest.com';
const PASSWORD = 'T@st1234';
const APP_URL = 'https://reviewsandmarketing.com';

async function selectPlanBadge(page) {
  return page.evaluate(() => {
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
  });
}

async function fillStripeCheckout(page) {
 await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 60000 });
 await new Promise((resolve) => setTimeout(resolve, 2000));
  const iframeInfo = await page.evaluate(() => Array.from(document.querySelectorAll('iframe')).map(f => ({ name: f.name, src: f.src })));
  console.log('Stripe iframes:', iframeInfo);
  const frameUrls = page.frames().map((frame) => frame.url());
  console.log('Stripe frames:', frameUrls);
  const frames = page.frames();
  const cardFrame = frames.find((frame) => frame.url().includes('card')); // may include numbers
  const expFrame = frames.find((frame) => frame !== cardFrame && frame.url().includes('card')); // fallback if multiple
  const cvcFrame = frames.find((frame) => frame.url().includes('cvc')) || cardFrame;

  const findInput = async (name) => {
    for (const frame of page.frames()) {
      try {
        const handle = await frame.waitForSelector(`input[name="${name}"]`, { timeout: 2000 });
        if (handle) return { frame, handle };
      } catch {}
    }
    throw new Error(`Unable to find input ${name}`);
  };

  const numberInput = await findInput('number');
  await numberInput.handle.type('4242424242424242', { delay: 20 });

  const expInput = await findInput('exp-date');
  await expInput.handle.type('12/34', { delay: 20 });

  const cvcInput = await findInput('cvc');
  await cvcInput.handle.type('123', { delay: 20 });

  try {
    const nameInput = await findInput('cardholder-name');
    await nameInput.handle.type('Puppeteer Test', { delay: 20 });
  } catch {}

  await page.waitForSelector('button[data-testid="hosted-payment-submit-button"]', { visible: true });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }),
    page.click('button[data-testid="hosted-payment-submit-button"]'),
  ]);
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  try {
    console.log('Logging in...');
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', EMAIL, { delay: 30 });
    await page.type('input[type="password"]', PASSWORD, { delay: 30 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    console.log('Initial plan badge:', await selectPlanBadge(page));

    console.log('Navigating to pricing (test mode)...');
    await page.goto(`${APP_URL}/pricing?mode=test`, { waitUntil: 'networkidle2' });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const upgradeHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((btn) => btn.textContent && btn.textContent.includes('Upgrade to Pro')) || null;
    });
    if (!upgradeHandle) throw new Error('Upgrade button not found');

    console.log('Clicking upgrade button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }),
      upgradeHandle.asElement().click()
    ]);

    console.log('On Stripe checkout:', page.url());
    await fillStripeCheckout(page);
    console.log('After checkout URL:', page.url());

    if (!page.url().includes('/dashboard')) {
      await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'networkidle2' });
    }
    await page.waitForSelector('main');
    const finalBadge = await selectPlanBadge(page);
    console.log('Final plan badge:', finalBadge);
  } catch (err) {
    console.error('Upgrade script failed:', err);
  } finally {
    await browser.close();
  }
})();
