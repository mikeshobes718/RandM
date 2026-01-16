import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/supabaseAdmin';

export async function GET() {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const { rows } = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.email,
        r.status,
        r.start_date,
        (SELECT COUNT(*) FROM leads WHERE assigned_to = r.id) as leads_assigned,
        (SELECT COUNT(*) FROM call_log WHERE rep_id = r.id) as calls_logged,
        (SELECT COUNT(*) FROM call_log WHERE rep_id = r.id AND timestamp > NOW() - INTERVAL '7 days') as calls_last_7_days,
        (SELECT COUNT(*) FROM customers WHERE closed_by = r.id) as closes,
        (SELECT COUNT(*) FROM customers WHERE closed_by = r.id AND signed_up_date > NOW() - INTERVAL '7 days') as closes_last_7_days,
        (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE rep_id = r.id) as total_earned,
        (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE rep_id = r.id AND status = 'pending') as pending_payout,
        EXTRACT(EPOCH FROM (NOW() - (SELECT MAX(timestamp) FROM call_log WHERE rep_id = r.id))) / 86400 as days_since_active
      FROM reps r
      ORDER BY r.created_at DESC
    `);

    // Calculate avg calls per day for flags
    const reps = rows.map(r => ({
      ...r,
      avg_calls_per_day: r.calls_logged / (Math.max(1, Math.ceil((new Date().getTime() - new Date(r.start_date).getTime()) / 86400000)))
    }));

    return NextResponse.json({ reps });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const { name, email, whatsapp, payment_method, payment_id, status, start_date, notes } = await req.json();

    // Generate unique tracking code
    const tracking_code = `rep_${Math.random().toString(36).substring(2, 8)}`;

    const { rows } = await pool.query(
      `INSERT INTO reps (name, email, whatsapp, payment_method, payment_id, status, start_date, tracking_code, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, email, whatsapp, payment_method, payment_id, status || 'trial', start_date || new Date(), tracking_code, notes]
    );

    return NextResponse.json({ rep: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
