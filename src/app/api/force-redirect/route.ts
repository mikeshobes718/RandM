import { NextResponse } from 'next/server';

export async function GET() {
  // Check if force redirect is enabled via environment variable
  const forceOnboardingRedirect = process.env.FORCE_ONBOARDING_REDIRECT === 'true';
  
  if (forceOnboardingRedirect) {
    return NextResponse.redirect(new URL('/onboarding/business', process.env.APP_URL || 'https://reviewsandmarketing.com'));
  }
  
  // Default redirect to dashboard if not forced
  return NextResponse.redirect(new URL('/dashboard', process.env.APP_URL || 'https://reviewsandmarketing.com'));
}

export const dynamic = 'force-dynamic';














