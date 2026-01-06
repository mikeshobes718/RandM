import { NextResponse } from 'next/server';
import { runSupabaseMigrations } from '@/lib/migrations';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tokenQ = url.searchParams.get('token') || '';
  const tokenH = req.headers.get('x-admin-token') || '';
  const token = tokenH || tokenQ;
  const { ADMIN_TOKEN } = getEnv();
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return new NextResponse('forbidden', { status: 403 });
  }
  try {
    const r = await runSupabaseMigrations();
    return NextResponse.json({ ok: true, ran: r.ran });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new NextResponse(`migration failed: ${msg}`, { status: 500 });
  }
}
