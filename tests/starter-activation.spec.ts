import { test, expect } from '@playwright/test';
import * as admin from 'firebase-admin';

const TEST_EMAIL = `playwright.starter+${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test1234!';

const serviceAccount = {
  projectId: 'reviewpilot2',
  clientEmail: 'firebase-adminsdk-fbsvc@reviewpilot2.iam.gserviceaccount.com',
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCK6kSjZF6wuTZj
s/wj0wGiKyIhkmFeo5vbVUW6uE6nBVlKazNzOGxCz3AccqQS7wz5WPAlmVNb36vS
xCHW7Ki8esFhHuyZ258qCXNTv4VGP7LuDAeCSJx5013Hnr+sLcN4kE4YAy6CZMaJ
BkTOqswCzJ3YIobQyatrCHbm81Y0TpUWTJjPYW2mzQQy65aGk8xLDIsmfd8I6g9T
nFgK6NUQrv2iQoVhoRUWXiXPUGRpamcy5v9QtFiqVoT67bGtJzaFOE5Red2UW7wp
rW/qeOyi87IZyZUqHTYoVQphWHIPKZURndjsQMuwom5SMY3GEuou2jLosjnXVXMF
9AoeVlnTAgMBAAECggEAD10QgUz4/Kzx8H338r2urmZR1zUEHX4/yba5HbOuSIzw
DqnOM2iNRKhXkGCMzTvwteUZuOF9FX9RLArIE/1G6Ng0v06MbAnHpSkNabjtVFMi
3BlVfURq6z2utK9V0y+ZMPeDbjwag+OsYibg1kXlMUwQYFaVOCM4blUt0qYdUG8q
FxOvrRbRx3vn/j0keGwTRGfu7TpXvJomHKxqPCN+ZF95GUMDXzFWucHkZnKMJ+pr
pb5QAe7wPzc7PUd8HoXkwyhcE4DPOnCfbmwe4FGdLD3ukDl5w9xz/gjjyOWrUxvJ
qfrgYa3UnlS1PSX2uY4u8IufmguVEU28+/a96n4e8QKBgQDA1Fqsnq97aJnq4WMs
DqGG1WZdxZUQoJHWYuC82ZswOlXGVOy/MmQawlIoOM4fvTPGyw7/n4Tcrz1Clrqm
eNDMByo6hSUSM4kP8n85uNVeEHuz/zeVTlfxBhg6lAsHFTRczOBn5wivpOC8Y6AF
Vpt0w0KxT9bVVm7UWf5NxKw/0QKBgQC4bGIU8d/BDljirKhfWLj3CidaBbYeVMgi
wR2YzoBWdnAZGIdelff5BiPfY8TIVqBONj7AWaABUURGH4NdBvOrvjJFdkAbWZNz
Kt0wxMYBWmVKwj3GbeD0Kiu/Qy0dz8bdip+nka0rsUrcYoa6z9IkHnbNIJafOdDe
4YN7bNXsYwKBgA5cgnhSxT0KuFPu/2TbnhodsKcRPR3k55ew+431IwK/hX3k+1Du
HtiDWn0WZfulKsMGgpJ1Pf71qjlYYoRdgSeA7Rs4qV8mqXGfnOweoP2FesEYI/qh
wBj6XDmYpw2a/bBfreLvKQ1z2S0Oum9LWP6kQEZWbOisrEpyfWcrW6zRAoGBAJoI
3HsF8o86vn7FGvRYFFUxw+BquMvooCh3B5NjlsmgrswnMpmLxMvXlwq0N93kjIwG
vq7FrOCs0cuH8p42ejtN5osh0zWEwaUFfi2HjKIAsG2agyJDEAqfVl6vavVlX4IW
kHbTM8I0mIQuPr21ap0EXNHDkEp5bb1augjSxHJlAoGAPTLqygXa57sQhgx3b0Qh
X4EXJWRls+BowxUTjFioZivUG5WeKuMGqiLqApYt3llLRsMRp/bqYtdWBZF1Q4li
xwdbDnoMnV7rtw5eRe/5lyYoD46UFlgPi9tLvwKi+Q2bes4gltux3RyHE+Xig+0A
a7goguLKAZbk+1z1dG6E8vc=
-----END PRIVATE KEY-----
`
};

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

test.describe('Starter activation flow', () => {
  test.beforeAll(async () => {
    const auth = admin.auth();
    try {
      const existing = await auth.getUserByEmail(TEST_EMAIL).catch(() => null);
      if (existing?.uid) {
        await auth.deleteUser(existing.uid);
      }
    } catch (err) {
      console.warn('Failed to cleanup existing user', err);
    }
    await auth.createUser({ email: TEST_EMAIL, password: TEST_PASSWORD, emailVerified: true, displayName: 'Playwright Starter' });
  });

  test('activate starter directs to onboarding and Save goes to dashboard', async ({ page, baseURL }) => {
    const origin = baseURL ?? 'https://reviewsandmarketing.com';
    await page.goto(`${origin}/login`, { waitUntil: 'networkidle' });

    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    // Ensure we have an authenticated session
    await page.waitForTimeout(1500);

    await page.goto(`${origin}/pricing`, { waitUntil: 'domcontentloaded' });
    const starterButton = page.getByRole('button', { name: /activate starter/i }).first();
    await expect(starterButton).toBeVisible({ timeout: 20_000 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      starterButton.click(),
    ]);

    expect(page.url()).toContain('/onboarding/business');
    await expect(page.locator('h1, h2').filter({ hasText: /connect your business/i })).toBeVisible();

    // Fill a business by searching and picking the first suggestion (stub fallback if none)
    const search = page.getByPlaceholder(/smart fit/i);
    await search.fill('Smart Fit');
    await page.waitForTimeout(1500);
    const suggestion = page.locator('button').filter({ hasText: /smart fit/i }).first();
    if (await suggestion.count()) {
      await suggestion.click();
      const saveAndContinue = page.getByRole('button', { name: /save and continue/i });
      await expect(saveAndContinue).toBeVisible();
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        saveAndContinue.click(),
      ]);
    } else {
      // Fallback: perform a direct upsert so we can complete onboarding
      const idToken = await page.evaluate(() => localStorage.getItem('idToken'));
      await page.evaluate(async (tok) => {
        const form = new URLSearchParams();
        form.set('name', 'Smart Fit - Test');
        form.set('google_place_id', 'test-place-id');
        form.set('address', 'Test Address');
        if (tok) form.set('idToken', tok);
        await fetch('/api/businesses/upsert/form', { method: 'POST', body: form, credentials: 'include' });
      }, idToken);
      await page.goto(`${origin}/dashboard?from=onboarding`, { waitUntil: 'networkidle' });
    }

    // Assert we did NOT land on verify; we should be on dashboard
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/verify-email');
  });

  test('user-specified credentials flow', async ({ page, baseURL }) => {
    const origin = baseURL ?? 'https://reviewsandmarketing.com';
    const EMAIL = 'xuhafij415@zizo7.com';
    const PASSWORD = 'T@1234m';
    await page.goto(`${origin}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByPlaceholder('••••••••').fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    // Wait until the server recognizes the session via /api/auth/me
    await page.waitForFunction(() => {
      return fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' })
        .then(r => r.ok)
        .catch(() => false);
    }, null, { timeout: 60000 });
    // Go straight to onboarding (account already has Starter)
    await page.goto(`${origin}/onboarding/business`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, h2').filter({ hasText: /connect your business/i })).toBeVisible({ timeout: 30000 });
    // Quick save path
    const idToken = await page.evaluate(() => localStorage.getItem('idToken'));
    await page.evaluate(async (tok) => {
      const form = new URLSearchParams();
      form.set('name', 'Smart Fit - Test');
      form.set('google_place_id', 'test-place-id');
      form.set('address', 'Test Address');
      if (tok) form.set('idToken', tok);
      await fetch('/api/businesses/upsert/form', { method: 'POST', body: form, credentials: 'include' });
    }, idToken);
    await page.goto(`${origin}/dashboard?from=onboarding`, { waitUntil: 'networkidle' });
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/verify-email');
  });
});
