import { NextResponse } from 'next/server';
import { runSupabaseMigrations } from '@/lib/migrations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await runSupabaseMigrations();
    return NextResponse.json({ 
      success: true, 
      message: 'Migrations script finished. Check "ran" list for applied steps.',
      ...result 
    });
  } catch (error: any) {
    console.error('[DEBUG/MIGRATIONS] Failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

