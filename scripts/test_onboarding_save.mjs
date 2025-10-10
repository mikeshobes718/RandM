// Minimal Node script to test onboarding upsert/form end-to-end using Firebase REST sign-in and production deployment
// Usage: node scripts/test_onboarding_save.mjs

const API_KEY = 'AIzaSyAbvy5lC1yczSa8HMmicpEYFFZz0tbHZ5s';
const EMAIL = 'test789@example.com';
const PASSWORD = 'TestPass123!';
const BASE = 'https://reviewsandmarketing-9md76fmfp-mikes-projects-9cbe43e2.vercel.app';

async function signIn() {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true })
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`signIn failed ${res.status}: ${text}`);
  }
  const j = JSON.parse(text);
  if (!j.idToken) throw new Error('signIn missing idToken');
  return j.idToken;
}

async function upsert(idToken) {
  const url = `${BASE}/api/businesses/upsert/form`;
  const params = new URLSearchParams();
  params.set('name', 'QA Test Business');
  params.set('review_link', 'https://maps.google.com/?cid=123456789');
  params.set('address', '123 Test St, Test City');
  params.set('idToken', idToken);
  params.set('email', EMAIL);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Bearer ${idToken}` },
    body: params,
    redirect: 'manual'
  });
  const body = await res.text().catch(() => '');
  console.log('[UPSERT] status:', res.status, 'type:', res.type, 'redirected:', res.redirected);
  console.log('[UPSERT] headers:', Object.fromEntries(res.headers.entries()));
  console.log('[UPSERT] body:', body.slice(0, 500));
}

(async () => {
  try {
    console.log('Signing in...');
    const idToken = await signIn();
    console.log('Got idToken (length):', idToken.length);
    console.log('Calling upsert/form...');
    await upsert(idToken);
  } catch (e) {
    console.error('Test failed:', e && e.message ? e.message : e);
    process.exitCode = 1;
  }
})();
