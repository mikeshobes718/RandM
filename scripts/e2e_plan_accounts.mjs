#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';

const ACCOUNTS = [
  {
    key: 'starter',
    email: 'wixihico31@advitise.com',
    password: 'T@st1234',
  },
  {
    key: 'pro',
    email: 'volurer295@ovbest.com',
    password: 'T@st1234',
  },
];

async function ensureVisible(page, selector, timeout = 60000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function gatherDashboardState(page) {
  return page.evaluate(async () => {
    const text = (document.body.innerText || '').replace(/\s+/g, ' ').trim();

    const findBadge = () => {
      const spans = Array.from(document.querySelectorAll('span'));
      const badge = spans.find((el) => {
        const txt = (el.textContent || '').trim();
        return /plan/i.test(txt) && /plan$|plan\b/i.test(txt);
      });
      return badge ? (badge.textContent || '').trim() : null;
    };

    const findHeaderChip = () => {
      const header = document.querySelector('header');
      if (!header) return null;
      const candidates = Array.from(header.querySelectorAll('span, a, button'));
      const chip = candidates.find((el) => {
        const txt = (el.textContent || '').trim();
        return /Starter|Pro|Trial/i.test(txt);
      });
      return chip ? (chip.textContent || '').trim() : null;
    };

    const findShareLink = () => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const match = inputs.find((input) => input.readOnly && typeof input.value === 'string' && /\/r\//.test(input.value));
      return match ? match.value : null;
    };

    const hasText = (needle) => text.toLowerCase().includes(needle.toLowerCase());

    const planStatus = await fetch('/api/plan/status', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .catch(() => null);

    const businessInfo = await fetch('/api/businesses/me', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .catch(() => null);

    const summary = await fetch('/api/dashboard/summary', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .catch(() => null);

    const entitlements = await fetch('/api/entitlements', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .catch(() => null);

    return {
      heroBadge: findBadge(),
      headerChip: findHeaderChip(),
      shareLink: findShareLink(),
      hasSquareConnected: hasText('Square connected'),
      hasSquareCta: hasText('Connect Square'),
      hasUpgradePrompt: hasText('View plans'),
      hasLandingSection: hasText('Review landing link'),
      hasMetrics: hasText('Share link scans') && hasText('Reviews this month'),
      planStatus,
      businessInfo,
      summary,
      entitlements,
    };
  });
}

async function runAccount(browser, account) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const result = {
    account: account.key,
    email: account.email,
    steps: [],
    finalUrl: null,
    page: null,
    ok: false,
    warnings: [],
    errors: [],
    dashboard: null,
  };
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    result.steps.push('login_page_loaded');

    const emailSel = 'input[aria-label="Email"], input[type="email"]';
    const passwordSel = 'input[aria-label="Password"], input[type="password"]';
    const submitSel = 'button[type="submit"]';

    if (!(await ensureVisible(page, emailSel))) {
      throw new Error('Email input missing');
    }
    await page.click(emailSel, { clickCount: 3 }).catch(() => undefined);
    await page.type(emailSel, account.email, { delay: 20 });

    if (!(await ensureVisible(page, passwordSel))) {
      throw new Error('Password input missing');
    }
    await page.click(passwordSel, { clickCount: 3 }).catch(() => undefined);
    await page.type(passwordSel, account.password, { delay: 20 });

    await Promise.all([
      page.click(submitSel),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => null),
    ]);
    result.steps.push('login_submitted');

    await page.waitForFunction(
      () => /\/dashboard|\/verify-email|\/onboarding/.test(window.location.pathname) || /login/.test(window.location.pathname) === false,
      { timeout: 120000 }
    ).catch(() => undefined);

    result.finalUrl = page.url();

    if (result.finalUrl.includes('/dashboard')) {
      result.page = 'dashboard';
      await page.waitForSelector('main', { timeout: 60000 }).catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const state = await gatherDashboardState(page);
      result.dashboard = state;
      result.ok = true;
      if (!state?.heroBadge) {
        result.warnings.push('Dashboard hero badge missing');
      }
      if (state?.planStatus?.status && state?.planStatus?.status.toLowerCase() === 'none') {
        result.warnings.push('Plan API reports none status');
      }
      if (!state?.shareLink) {
        result.warnings.push('Share link missing');
      }
      if (!state?.hasMetrics) {
        result.warnings.push('Metrics section absent');
      }
      if (account.key === 'starter') {
        if (state?.entitlements?.pro) {
          result.errors.push('Starter entitlements still return pro=true');
        }
        if (state?.hasSquareCta) {
          result.warnings.push('Starter still sees Square CTA copy');
        }
      }
    } else if (result.finalUrl.includes('/verify-email')) {
      result.page = 'verify-email';
      result.errors.push('Account redirected to verify-email');
    } else if (result.finalUrl.includes('/onboarding')) {
      result.page = 'onboarding';
      result.warnings.push('Account sent to onboarding');
      result.ok = true;
    } else {
      result.page = 'unknown';
      result.errors.push('Unexpected landing page');
    }
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
  } finally {
    await context.close().catch(() => undefined);
  }
  return result;
}

async function main() {
  const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
  const browser = await puppeteer.launch({ headless: 'new', args: launchArgs });
  const outcomes = [];
  for (const account of ACCOUNTS) {
    const res = await runAccount(browser, account);
    outcomes.push(res);
  }
  await browser.close();
  const ok = outcomes.every((item) => item.ok && item.errors.length === 0);
  console.log(JSON.stringify({ ok, accounts: outcomes }, null, 2));
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error('E2E run failed', err);
  process.exit(1);
});
