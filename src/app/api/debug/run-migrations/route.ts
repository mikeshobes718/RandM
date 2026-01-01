import { NextResponse } from 'next/server';
import { runSupabaseMigrations } from '@/lib/migrations';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const result = await runSupabaseMigrations();
    return NextResponse.json({
      success: true,
      ran: result.ran
    });
  } catch (error: any) {
    console.error('[MIGRATE] Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

