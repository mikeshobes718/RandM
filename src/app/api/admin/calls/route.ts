import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/supabaseAdmin';

export async function GET() {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const res = await pool.query(`
      SELECT 
        cl.id,
        cl.timestamp,
        cl.outcome,
        cl.notes,
        cl.followup_date,
        r.name as rep_name,
        l.name as lead_name,
        l.phone as lead_phone
      FROM call_log cl
      JOIN reps r ON cl.rep_id = r.id
      JOIN leads l ON cl.lead_id = l.id
      ORDER BY cl.timestamp DESC
      LIMIT 500
    `);

    return NextResponse.json({ calls: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
