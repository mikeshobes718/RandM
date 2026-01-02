import { NextResponse } from 'next/server';
import { runSupabaseMigrations } from '@/lib/migrations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await runSupabaseMigrations();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

