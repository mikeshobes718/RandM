const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Manual parse of .env.local because it might be weirdly formatted
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\\n|\n/).forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    env[key.trim()] = vals.join('=').trim();
  }
});

async function cleanupUser(email) {
  console.log(`--- CLEANUP START: ${email} ---`);
  
  if (!env.FIREBASE_SERVICE_ACCOUNT_B64) {
    console.error('FIREBASE_SERVICE_ACCOUNT_B64 not found in parsed env');
    return;
  }

  // 1. Init Firebase
  if (!admin.apps.length) {
    const b64 = env.FIREBASE_SERVICE_ACCOUNT_B64;
    const json = Buffer.from(b64, 'base64').toString('utf8');
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(json))
    });
  }
  const auth = admin.auth();

  // 2. Init Supabase
  const supa = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    // 3. Find Firebase User
    const userRecord = await auth.getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      console.log('Firebase user not found');
    } else {
      const uid = userRecord.uid;
      console.log(`Found UID: ${uid}`);

      // 4. Delete from Supabase tables
      const tables = ['review_events', 'subscriptions', 'businesses', 'users'];
      for (const table of tables) {
        const { error } = await supa.from(table).delete().eq('uid', uid);
        if (error) console.error(`Error deleting from ${table}:`, error.message);
        else console.log(`Deleted from ${table}`);
      }

      // 5. Delete from Firebase
      await auth.deleteUser(uid);
      console.log('Deleted from Firebase Auth');
    }
  } catch (err) {
    console.error('Cleanup failed:', err);
  }
  console.log('--- CLEANUP COMPLETE ---');
}

cleanupUser('mikeybobby718@godfare.com').then(() => process.exit(0));
