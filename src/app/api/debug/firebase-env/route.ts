import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_CLIENT_ID: !!process.env.FIREBASE_CLIENT_ID,
      FIREBASE_AUTH_URI: !!process.env.FIREBASE_AUTH_URI,
      FIREBASE_TOKEN_URI: !!process.env.FIREBASE_TOKEN_URI,
      FIREBASE_AUTH_PROVIDER_X509_CERT_URL: !!process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      FIREBASE_CLIENT_X509_CERT_URL: !!process.env.FIREBASE_CLIENT_X509_CERT_URL,
      FIREBASE_UNIVERSE_DOMAIN: !!process.env.FIREBASE_UNIVERSE_DOMAIN,
      FIREBASE_SERVICE_ACCOUNT_B64: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
      projectId: process.env.FIREBASE_PROJECT_ID || 'not set',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'not set'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}














