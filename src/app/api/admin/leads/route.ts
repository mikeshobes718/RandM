import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/supabaseAdmin';

export async function GET() {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const res = await pool.query(`
      SELECT 
        l.id,
        l.name,
        l.phone,
        l.city,
        l.state,
        l.rating,
        l.times_called,
        l.call_status as status,
        l.last_called_at,
        r.name as assigned_to_name
      FROM leads l
      LEFT JOIN reps r ON l.assigned_to = r.id
      ORDER BY l.created_at DESC
      LIMIT 1000
    `);

    return NextResponse.json({ leads: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
