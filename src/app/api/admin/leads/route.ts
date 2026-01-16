import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/supabaseAdmin';

export async function GET() {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    // 1. Fetch all leads
    const leadsRes = await pool.query(`
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
        l.last_called_by_email as assigned_to_name
      FROM leads l
      ORDER BY l.created_at DESC
      LIMIT 1000
    `);

    // 2. Fetch metrics per rep and total
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const metricsRes = await pool.query(`
      WITH rep_metrics AS (
        SELECT 
          u.rep_id as rep_name,
          u.email as rep_email,
          COUNT(CASE WHEN cl.timestamp::date = $1::date THEN 1 END) as calls_today,
          COUNT(CASE WHEN cl.outcome = 'callback' AND cl.timestamp::date = $1::date THEN 1 END) as appointments_today,
          COUNT(CASE WHEN l.call_status = 'closed' AND l.last_called_at::date >= $2::date THEN 1 END) as closes_this_month
        FROM users u
        LEFT JOIN call_log cl ON cl.rep_id = u.uid
        LEFT JOIN leads l ON l.last_called_by_email = u.email
        WHERE u.role = 'sales_rep'
        GROUP BY u.rep_id, u.email
      )
      SELECT 
        rep_name,
        rep_email,
        calls_today,
        appointments_today,
        closes_this_month
      FROM rep_metrics
      ORDER BY closes_this_month DESC
    `, [today, firstOfMonth]);

    const totalMetrics = {
      callsToday: metricsRes.rows.reduce((sum: number, r: any) => sum + parseInt(r.calls_today || 0), 0),
      appointments: metricsRes.rows.reduce((sum: number, r: any) => sum + parseInt(r.appointments_today || 0), 0),
      closesThisMonth: metricsRes.rows.reduce((sum: number, r: any) => sum + parseInt(r.closes_this_month || 0), 0),
    };

    return NextResponse.json({ 
      leads: leadsRes.rows,
      repMetrics: metricsRes.rows,
      totalMetrics
    });
  } catch (err: any) {
    console.error('Admin Leads API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
