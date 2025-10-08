import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const env = getEnv();
    
    // Check email configuration
    const emailConfig = {
      hasPostmarkToken: Boolean(env.POSTMARK_SERVER_TOKEN && env.POSTMARK_SERVER_TOKEN.trim() !== ''),
      hasEmailFrom: Boolean(env.EMAIL_FROM && env.EMAIL_FROM.trim() !== ''),
      hasResendKey: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== ''),
      emailFrom: env.EMAIL_FROM,
      postmarkTokenLength: env.POSTMARK_SERVER_TOKEN?.length || 0,
      resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
    };

    return NextResponse.json({
      success: true,
      emailConfig,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
