#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const EMAIL = process.env.TEST_EMAIL || 'wixihico31@advitise.com';
const PASSWORD = process.env.TEST_PASSWORD || 'T@st1234';

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function clickByText(page, selector, text) {
  const handle = await page.evaluateHandle((sel, targetText) => {
    const elements = Array.from(document.querySelectorAll(sel));
    return elements.find((el) => el.textContent && el.textContent.trim().toLowerCase().includes(targetText.trim().toLowerCase())) || null;
  }, selector, text);
  if (!handle) throw new Error(`Element with text "${text}" not found for selector ${selector}`);
  await page.evaluate((el) => el.click(), handle);
}

async function fetchPlanStatus(page, label) {
  const plan = await page.evaluate(async () => {
    try {
      const headers = {};
      try {
        const token = localStorage.getItem('idToken');
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {}
      const res = await fetch('/api/plan/status', { headers, credentials: 'include' });
      const text = await res.text();
      return { ok: res.ok, status: res.status, body: text };
    } catch (err) {
      return { ok: false, status: null, body: String(err) };
    }
  });
  return { label, plan };
}

async function readTokenInfo(page, label) {
  const info = await page.evaluate(() => {
    try {
      const token = localStorage.getItem('idToken');
      if (!token) return { hasToken: false };
      const [, payloadB64] = token.split('.');
      const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(normalized));
      const uid = json.user_id || json.sub || json.uid || null;
      return {
        hasToken: true,
        tokenSnippet: `${token.slice(0, 12)}...${token.slice(-6)}`,
        uid,
        email: json.email || null,
        emailVerified: json.email_verified ?? null,
      };
    } catch (err) {
      return { hasToken: false, error: String(err) };
    }
  });
  return { label, info };
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

    const tokenInfo = await readTokenInfo(page, 'post-login-token');
    results.push(tokenInfo);

    const postLoginPlan = await fetchPlanStatus(page, 'after-login');
    results.push(postLoginPlan);

    await page.goto(`${BASE}/pricing`, { waitUntil: 'networkidle0', timeout: 60000 });
    results.push({ step: 'pricing', url: page.url() });

    await page.waitForFunction(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find((el) => /activate starter/i.test(el.textContent || ''));
      return btn && !btn.disabled;
    }, { timeout: 30000 }).catch(() => {});

    const beforeClickPlan = await fetchPlanStatus(page, 'before-activate');
    results.push(beforeClickPlan);

    await clickByText(page, 'button', 'Activate Starter');

    await sleep(500);
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await sleep(2000);
    results.push({ step: 'after-activate', url: page.url(), title: await page.title() });

    const finalPlan = await fetchPlanStatus(page, 'after-activate-plan');
    results.push(finalPlan);

    console.log(JSON.stringify({ ok: true, results }, null, 2));
    await browser.close();
  } catch (err) {
    console.error('debug failed', err);
    try { console.log(JSON.stringify({ ok: false, results }, null, 2)); } catch {}
    await browser.close();
    process.exit(1);
  }
}

main();
