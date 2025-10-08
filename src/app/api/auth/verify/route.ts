import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');
  const { APP_URL } = getEnv();

  if (!oobCode || !mode) {
    return NextResponse.redirect(`${APP_URL}/verify-email?error=invalid-link`);
  }

  const auth = getAuthAdmin();

  try {
    if (mode === 'verifyEmail') {
      // Verify the email
      await auth.applyActionCode(oobCode);
      console.log('[VERIFY] ✅ Email verified successfully');
      return NextResponse.redirect(`${APP_URL}/verify-email?verified=true`);
    } else if (mode === 'resetPassword') {
      // Handle password reset
      console.log('[VERIFY] ✅ Password reset link verified');
      return NextResponse.redirect(`${APP_URL}/login?reset=true&oobCode=${oobCode}`);
    } else {
      console.log('[VERIFY] ❌ Invalid mode:', mode);
      return NextResponse.redirect(`${APP_URL}/verify-email?error=invalid-mode`);
    }
  } catch (error) {
    console.error('[VERIFY] ❌ Action code application failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle specific Firebase errors
    if (errorMessage.includes('expired')) {
      return NextResponse.redirect(`${APP_URL}/verify-email?error=expired`);
    } else if (errorMessage.includes('invalid')) {
      return NextResponse.redirect(`${APP_URL}/verify-email?error=invalid`);
    } else {
      return NextResponse.redirect(`${APP_URL}/verify-email?error=verification-failed`);
    }
  }
}
