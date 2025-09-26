#!/usr/bin/env node

import process from 'process';
import admin from 'firebase-admin';
import { initializeApp as initClientApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, setPersistence, inMemoryPersistence, sendEmailVerification } from 'firebase/auth';

async function main() {
  const email = process.argv[2] || process.env.TARGET_EMAIL;
  const uid = process.argv[3] || process.env.TARGET_UID;
  if (!email || !uid) {
    console.error('Usage: node scripts/send_firebase_verification.mjs <email> <uid>');
    console.error('Or provide TARGET_EMAIL and TARGET_UID environment variables.');
    process.exit(1);
  }

  const serviceAccountB64 = process.env.FIREBASE_ADMIN_B64;
  if (!serviceAccountB64) {
    console.error('Missing FIREBASE_ADMIN_B64 environment variable.');
    process.exit(1);
  }

  const clientConfig = {
    apiKey: process.env.FIREBASE_WEB_API_KEY,
    authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_WEB_PROJECT_ID,
    storageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_WEB_APP_ID,
  };

  if (!clientConfig.apiKey || !clientConfig.authDomain || !clientConfig.projectId || !clientConfig.appId) {
    console.error('Missing Firebase web config. Set FIREBASE_WEB_* env vars.');
    process.exit(1);
  }

  const serviceAccountJson = Buffer.from(serviceAccountB64, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(serviceAccountJson);

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key?.replace(/\\n/g, '\n'),
    }) });
  }

  const targetUser = await admin.auth().getUser(uid);
  if (!targetUser.email) {
    console.error(`User ${uid} does not have an email on record.`);
    process.exit(1);
  }
  if (targetUser.email.toLowerCase() !== email.toLowerCase()) {
    console.warn(`Provided email (${email}) does not match user record (${targetUser.email}). Proceeding with recorded email.`);
  }

  const app = initClientApp(clientConfig);
  const auth = getAuth(app);
  await setPersistence(auth, inMemoryPersistence);

  const customToken = await admin.auth().createCustomToken(uid);
  const credential = await signInWithCustomToken(auth, customToken);

  const redirectUrl = process.env.VERIFY_REDIRECT_URL || 'https://reviewsandmarketing.com/verify-email';
  await sendEmailVerification(credential.user, { url: redirectUrl, handleCodeInApp: false });

  console.log(`✅ Verification email dispatched via Firebase for ${targetUser.email}`);
}

main().catch((err) => {
  console.error('Failed to send Firebase verification email:', err);
  process.exit(1);
});
