import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/supabaseAdmin';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const { id } = await params;

  try {
    const repRes = await pool.query(`
      SELECT 
        r.*,
        (SELECT COUNT(*) FROM leads WHERE assigned_to = r.id) as leads_assigned,
        (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE rep_id = r.id) as total_earned,
        (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE rep_id = r.id AND status = 'pending') as pending_payout
      FROM reps r
      WHERE r.id = $1
    `, [id]);

    const closesRes = await pool.query(`
      SELECT 
        c.id,
        c.business_name,
        c.plan,
        c.signed_up_date,
        com.amount
      FROM customers c
      JOIN commissions com ON com.customer_id = c.id
      WHERE c.closed_by = $1
      ORDER BY c.signed_up_date DESC
    `, [id]);

    return NextResponse.json({ 
      rep: repRes.rows[0],
      closes: closesRes.rows
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
