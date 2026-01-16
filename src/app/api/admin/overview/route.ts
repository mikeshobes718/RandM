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

    // 6. Call Metrics
    const callsTodayRes = await pool.query(`SELECT COUNT(*) as calls FROM call_log WHERE timestamp > CURRENT_DATE`);
    const callsWeekRes = await pool.query(`SELECT COUNT(*) as calls FROM call_log WHERE timestamp > NOW() - INTERVAL '7 days'`);
    const totalCallsRes = await pool.query(`SELECT COUNT(*) as calls FROM call_log`);
    const totalClosesRes = await pool.query(`SELECT COUNT(*) as closes FROM call_log WHERE outcome = 'closed'`);

    // 7. Call Activity by Rep (Last 7 Days)
    const repActivityRes = await pool.query(`
      SELECT r.name, COUNT(cl.id) as call_count
      FROM reps r
      LEFT JOIN call_log cl ON cl.rep_id = r.id AND cl.timestamp > NOW() - INTERVAL '7 days'
      WHERE r.status IN ('trial', 'active')
      GROUP BY r.name
      ORDER BY call_count DESC
    `);

    return NextResponse.json({
      mrr: mrrRes.rows[0]?.mrr || 0,
      activeCustomers: customersRes.rows[0]?.active_customers || 0,
      activeReps: repsRes.rows[0]?.active_reps || 0,
      closesThisWeek: closesWeekRes.rows[0]?.closes || 0,
      commissionsOwed: owedRes.rows[0]?.owed || 0,
      callsToday: callsTodayRes.rows[0]?.calls || 0,
      callsThisWeek: callsWeekRes.rows[0]?.calls || 0,
      totalCalls: totalCallsRes.rows[0]?.calls || 0,
      totalCloses: totalClosesRes.rows[0]?.closes || 0,
      repActivity: repActivityRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
