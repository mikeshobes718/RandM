#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function loadDotenv(file) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function initAdmin() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  loadDotenv(envPath);
  const b64 = (process.env.FIREBASE_SERVICE_ACCOUNT_B64 || '').trim();
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 not set');
  let raw;
  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    raw = JSON.parse(decoded);
  } catch (e) {
    throw new Error('Failed to decode FIREBASE_SERVICE_ACCOUNT_B64');
  }
  const svc = {
    projectId: String(raw.project_id || raw.projectId || ''),
    clientEmail: String(raw.client_email || raw.clientEmail || ''),
    privateKey: String(raw.private_key || raw.privateKey || ''),
  };
  if (!svc.projectId || !svc.clientEmail || !svc.privateKey) throw new Error('Invalid service account JSON');
  if (!getApps().length) initializeApp({ credential: cert(svc) });
  return getAuth();
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3] || 'Temp1234!';
  if (!email) {
    console.error('Usage: node scripts/admin_set_user.mjs <email> [password]');
    process.exit(2);
  }
  const auth = initAdmin();
  let user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) {
    user = await auth.createUser({ email, password, emailVerified: true, displayName: 'Automation User' });
  } else {
    await auth.updateUser(user.uid, { password, emailVerified: true });
    user = await auth.getUser(user.uid);
  }
  console.log(JSON.stringify({ uid: user.uid, email: user.email, emailVerified: user.emailVerified }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });


