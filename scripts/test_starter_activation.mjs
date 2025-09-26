#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const EMAIL = process.env.TEST_EMAIL || 'wixihico31@advitise.com';
const PASSWORD = process.env.TEST_PASSWORD || 'T@st1234';

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

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
  const results = [];

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('input[type=email]', { timeout: 15000 });
    await page.type('input[type=email]', EMAIL, { delay: 15 });
    await page.type('input[type=password]', PASSWORD, { delay: 15 });
    await clickByText(page, 'button', 'Sign in');

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {});
   results.push({ step: 'login', url: page.url() });
   const idToken = await page.evaluate(() => {
     try { return localStorage.getItem('idToken'); } catch { return null; }
   });
   results.push({ step: 'after login localStorage', idTokenPresent: Boolean(idToken), tokenSnippet: idToken ? `${idToken.slice(0,20)}...` : null });

    if (idToken) {
      const planStatusBefore = await page.evaluate(async () => {
        try {
          const headers = { Authorization: `Bearer ${localStorage.getItem('idToken')}` };
          const res = await fetch('/api/plan/status', { headers });
          const text = await res.text();
          return { ok: res.ok, status: res.status, body: text };
        } catch (e) {
          return { ok: false, error: String(e) };
        }
      });
      results.push({ step: 'plan-status-before', planStatusBefore });
    }

    await page.goto(`${BASE}/pricing`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2000);
    results.push({ step: 'pricing', url: page.url() });

    // Wait for plan status buttons to resolve
    await page.waitForFunction(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find((el) => /activate starter/i.test(el.textContent || ''));
      return btn && !btn.disabled;
    }, { timeout: 30000 }).catch(() => {});

    await clickByText(page, 'button', 'Activate Starter');
    await sleep(500);
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {});
    results.push({ step: 'after activate', url: page.url() });

    await sleep(2000);
    results.push({ step: 'final', url: page.url(), title: await page.title() });

    console.log(JSON.stringify({ ok: true, results }, null, 2));
    await browser.close();
  } catch (err) {
    console.error('Activation test failed:', err);
    try { console.log(JSON.stringify({ ok: false, results }, null, 2)); } catch {}
    await browser.close();
    process.exit(1);
  }
}

main();
