import * as admin from 'firebase-admin';
import { getEnv } from './env';

let _app: admin.app.App | null = null;

export function getFirebaseAdminApp(): admin.app.App {
  if (_app) return _app;
  
  // Check if there's already an app initialized
  if (admin.apps.length > 0) {
    _app = admin.app();
    return _app;
  }
  
  const env = getEnv();
  
  // Prefer chunked FIREBASE_B64_* parts first; fallback to single FIREBASE_SERVICE_ACCOUNT_B64
  const aggregatedB64 = (() => {
    let combined = '';
    for (let i = 1; i <= 20; i++) {
      const part = process.env[`FIREBASE_B64_${i}` as keyof NodeJS.ProcessEnv];
      if (!part) break;
      combined += part;
    }
    if (combined && combined.trim().length > 0) return combined;
    if (env.FIREBASE_SERVICE_ACCOUNT_B64) return env.FIREBASE_SERVICE_ACCOUNT_B64;
    return '';
  })();

  if (aggregatedB64) {
    try {
      const json = Buffer.from(aggregatedB64, 'base64').toString('utf8');
      const raw = JSON.parse(json) as Record<string, unknown>;
      // Normalize property names expected by admin SDK
      const normalized: admin.ServiceAccount = {
        projectId: String(raw.projectId ?? raw['project_id'] ?? ''),
        clientEmail: String(raw.clientEmail ?? raw['client_email'] ?? ''),
        privateKey: String(raw.privateKey ?? raw['private_key'] ?? ''),
      };
      // Fix PEM newlines and stray \r
      if (typeof normalized.privateKey === 'string') {
        normalized.privateKey = normalized.privateKey.replace(/\r\n?/g, '\n').replace(/\\n/g, '\n');
      }
      if (!normalized || typeof normalized.projectId !== 'string' || !normalized.projectId) {
        throw new Error('Invalid service account JSON (missing project_id)');
      }
      _app = admin.initializeApp({ credential: admin.credential.cert(normalized) });
      console.log('✅ Firebase Admin SDK initialized successfully with base64 (chunked/single)');
      return _app;
    } catch (error) {
      console.error('❌ Firebase Admin SDK initialization failed with base64 (chunked/single):', error);
      // Continue to fallbacks below
    }
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
    // Try individual environment variables (fallback)
    try {
      const serviceAccount = {
        projectId: env.FIREBASE_PROJECT_ID,
        privateKeyId: env.FIREBASE_PRIVATE_KEY_ID || '',
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        clientId: env.FIREBASE_CLIENT_ID || '',
        authUri: env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        tokenUri: env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
        authProviderX509CertUrl: env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
        clientX509CertUrl: env.FIREBASE_CLIENT_X509_CERT_URL || '',
        universeDomain: env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com'
      };
      _app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('✅ Firebase Admin SDK initialized successfully with individual env vars');
      return _app;
    } catch (error) {
      console.error('❌ Firebase Admin SDK initialization with individual env vars failed:', error);
      throw new Error(`Firebase Admin SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    throw new Error('Firebase configuration not found. Please set either individual Firebase environment variables or FIREBASE_SERVICE_ACCOUNT_B64');
  }
}

export function getAuthAdmin(): admin.auth.Auth {
  return admin.auth(getFirebaseAdminApp());
}
