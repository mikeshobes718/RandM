import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const { leadIds, repId } = await req.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
    }

    // Assign leads to rep
    await pool.query(
      `UPDATE leads SET assigned_to = $1, updated_at = NOW() WHERE id = ANY($2)`,
      [repId || null, leadIds]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
