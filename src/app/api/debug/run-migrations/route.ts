import { NextResponse } from 'next/server';
import { runSupabaseMigrations } from '@/lib/migrations';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  const env = getEnv();
  // Using a hardcoded fallback if env not set for debug
  const secret = process.env.MIGRATIONS_ONCE_TOKEN || 'mike_debug_123';
  
  if (token !== secret) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { ran } = await runSupabaseMigrations();
    return NextResponse.json({ success: true, ran });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

