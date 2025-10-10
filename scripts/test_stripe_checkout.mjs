// Test Stripe checkout API directly
const BASE = 'https://reviewsandmarketing-9md76fmfp-mikes-projects-9cbe43e2.vercel.app';
const API_KEY = 'AIzaSyAbvy5lC1yczSa8HMmicpEYFFZz0tbHZ5s';
const EMAIL = 'test789@example.com';
const PASSWORD = 'TestPass123!';

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

async function testCheckout(idToken) {
  const url = `${BASE}/api/stripe/checkout`;
  const payload = { plan: 'monthly' };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(payload)
  });
  const body = await res.text().catch(() => '');
  console.log('[CHECKOUT] status:', res.status);
  console.log('[CHECKOUT] headers:', Object.fromEntries(res.headers.entries()));
  console.log('[CHECKOUT] body:', body.slice(0, 500));
}

(async () => {
  try {
    console.log('Signing in...');
    const idToken = await signIn();
    console.log('Got idToken (length):', idToken.length);
    console.log('Testing Stripe checkout...');
    await testCheckout(idToken);
  } catch (e) {
    console.error('Test failed:', e && e.message ? e.message : e);
    process.exitCode = 1;
  }
})();
