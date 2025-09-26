import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const env = getEnv();
    const b64 = env.FIREBASE_SERVICE_ACCOUNT_B64;
    
    let decodedJson = '';
    let parsedJson = null;
    let parseError = null;
    let projectId = 'N/A';
    let clientEmail = 'N/A';
    let hasPrivateKey = false;

    if (b64) {
      try {
        decodedJson = Buffer.from(b64, 'base64').toString('utf8');
        parsedJson = JSON.parse(decodedJson);
        projectId = parsedJson.project_id || parsedJson.projectId || 'N/A';
        clientEmail = parsedJson.client_email || parsedJson.clientEmail || 'N/A';
        hasPrivateKey = !!(parsedJson.private_key || parsedJson.privateKey);
      } catch (e: unknown) {
        parseError = `Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`;
      }
    }

    // Try to initialize Firebase Admin
    let firebaseInitError = null;
    let firebaseAppsCount = 0;
    let firebaseProjectId = 'N/A';
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin');
      firebaseAppsCount = admin.apps.length;
      
      if (firebaseAppsCount === 0) {
        // Try to initialize
        const serviceAccount = parsedJson;
        if (serviceAccount) {
          const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          firebaseProjectId = app.options.projectId || 'N/A';
        }
      } else {
        const app = admin.app();
        firebaseProjectId = app.options.projectId || 'N/A';
      }
    } catch (e: unknown) {
      firebaseInitError = `Firebase Admin init failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      success: !parseError && !firebaseInitError,
      parseError,
      firebaseInitError,
      hasServiceAccount: !!b64,
      serviceAccountLength: b64?.length || 0,
      decodedLength: decodedJson.length,
      projectId,
      clientEmail,
      hasPrivateKey,
      firebaseAppsCount,
      firebaseProjectId,
      decodedJsonPreview: decodedJson.substring(0, 200),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
      serviceAccountLength: process.env.FIREBASE_SERVICE_ACCOUNT_B64?.length || 0,
    }, { status: 500 });
  }
}
