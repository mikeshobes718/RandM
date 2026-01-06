import { NextResponse } from 'next/server';
import { runSupabaseMigrations } from '@/lib/migrations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const r = await runSupabaseMigrations();
    return NextResponse.json({ ok: true, ran: r.ran });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new NextResponse(`migration failed: ${msg}`, { status: 500 });
  }
}

