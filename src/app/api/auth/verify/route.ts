import { NextResponse } from 'next/server';
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

  // Pass the verification parameters to the client-side page
  // The client-side will handle the actual verification using Firebase client SDK
  if (mode === 'verifyEmail') {
    return NextResponse.redirect(`${APP_URL}/verify-email?mode=verifyEmail&oobCode=${oobCode}`);
  } else if (mode === 'resetPassword') {
    return NextResponse.redirect(`${APP_URL}/login?mode=resetPassword&oobCode=${oobCode}`);
  } else {
    return NextResponse.redirect(`${APP_URL}/verify-email?error=invalid-mode`);
  }
}
