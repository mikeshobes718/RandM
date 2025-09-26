#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE = process.env.APP_URL || 'https://reviewsandmarketing.com';
const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('Usage: node scripts/activate_starter_via_rest.mjs <email> <password>');
  process.exit(2);
}

async function main(){
  const idRes = await fetch(`${BASE}/api/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: null }) }).catch(()=>null);
  if (idRes && idRes.ok) {}

  // Firebase REST sign-in
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyAbvy5lC1yczSa8HMmicpEYFFZz0tbHZ5s';
  const signIn = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  if (!signIn.ok) {
    const txt = await signIn.text();
    console.error('Sign-in failed:', txt);
    process.exit(1);
  }
  const data = await signIn.json();
  const idToken = data.idToken;

  // Create server session cookie
  await fetch(`${BASE}/api/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, days: 7 }) });

  // Activate starter
  const start = await fetch(`${BASE}/api/plan/start`, { method: 'POST', headers: { Authorization: `Bearer ${idToken}` } });
  const ok = start.ok;
  const body = await start.text();
  console.log('activate response:', start.status, body);

  // Check plan status
  const status = await fetch(`${BASE}/api/plan/status`, { headers: { Authorization: `Bearer ${idToken}` } });
  const js = await status.json().catch(()=>({}));
  console.log('plan status:', js);
}

main().catch((e)=>{ console.error(e); process.exit(1); });


