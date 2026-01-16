import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/supabaseAdmin';

export async function GET() {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    // 1. MRR (sum of active subscriptions)
    const mrrRes = await pool.query(`
      SELECT SUM(CASE 
        WHEN plan_id = 'unlimited' THEN 199 
        WHEN plan_id = 'pro' THEN 99 
        ELSE 49 
      END) as mrr
      FROM subscriptions 
      WHERE status = 'active'
    `);

    // 2. Active Customers
    const customersRes = await pool.query(`SELECT COUNT(*) as active_customers FROM subscriptions WHERE status = 'active'`);

    // 3. Active Reps
    const repsRes = await pool.query(`SELECT COUNT(*) as active_reps FROM reps WHERE status IN ('trial', 'active')`);

    // 4. Closes This Week
    const closesWeekRes = await pool.query(`
      SELECT COUNT(*) as closes 
      FROM businesses 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    // 5. Commissions Owed
    const owedRes = await pool.query(`SELECT SUM(amount) as owed FROM commissions WHERE status = 'pending'`);

    return NextResponse.json({
      mrr: mrrRes.rows[0]?.mrr || 0,
      activeCustomers: customersRes.rows[0]?.active_customers || 0,
      activeReps: repsRes.rows[0]?.active_reps || 0,
      closesThisWeek: closesWeekRes.rows[0]?.closes || 0,
      commissionsOwed: owedRes.rows[0]?.owed || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
