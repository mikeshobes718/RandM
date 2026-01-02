import { NextResponse } from 'next/server';
import { runSupabaseMigrations } from '@/lib/migrations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await runSupabaseMigrations();
    return NextResponse.json({ success: true, ran: result.ran });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
