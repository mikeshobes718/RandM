import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const env = getEnv();
    const auth = getAuthAdmin();
    
    return NextResponse.json({
      success: true,
      hasFirebaseServiceAccount: !!env.FIREBASE_SERVICE_ACCOUNT_B64,
      firebaseServiceAccountLength: env.FIREBASE_SERVICE_ACCOUNT_B64?.length || 0,
      firebaseAppsCount: auth.app.options.projectId ? 1 : 0,
      projectId: auth.app.options.projectId || 'none'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasFirebaseServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
      firebaseServiceAccountLength: process.env.FIREBASE_SERVICE_ACCOUNT_B64?.length || 0
    }, { status: 500 });
  }
}











