import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/supabaseAdmin';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const id = params.id;

  try {
    const res = await pool.query(`
      SELECT 
        cl.id,
        cl.timestamp,
        cl.outcome,
        cl.notes,
        l.name as lead_name
      FROM call_log cl
      JOIN leads l ON cl.lead_id = l.id
      WHERE cl.rep_id = $1
      ORDER BY cl.timestamp DESC
      LIMIT 100
    `, [id]);

    return NextResponse.json({ calls: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
