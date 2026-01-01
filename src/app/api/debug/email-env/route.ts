import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const env = getEnv();
  
  const obscure = (val?: string) => {
    if (!val) return 'MISSING';
    if (val.length < 8) return 'TOO_SHORT';
    return `${val.substring(0, 4)}...${val.substring(val.length - 4)}`;
  };

  return NextResponse.json({
    EMAIL_FROM: env.EMAIL_FROM,
    POSTMARK_TOKEN: obscure(process.env.POSTMARK_SERVER_TOKEN),
    RESEND_KEY: obscure(process.env.RESEND_API_KEY),
    APP_URL: env.APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || 'not-vercel'
  });
}

