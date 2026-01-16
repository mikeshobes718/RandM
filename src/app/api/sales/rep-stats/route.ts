import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const repId = searchParams.get('repId'); // This is the static REP ID from users table
  const supa = getSupabaseAdmin();

  const defaults = {
    callsLogged: 0,
    closesThisWeek: 0,
    commissionEarned: 0,
    pendingCommission: 0,
    payoutHistory: [],
    nextPayoutDate: "TBD",
    estimatedNextPayout: 0
  };

  if (!repId) {
    return NextResponse.json(defaults);
  }

  try {
    // 1. Get the user's email and UUID using the static repId
    const { data: userData, error: userError } = await supa
      .from('users')
      .select('uid, email')
      .eq('rep_id', repId)
      .maybeSingle();

    if (userError || !userData) {
      console.warn('[REP STATS] User not found for repId:', repId);
      return NextResponse.json(defaults);
    }

    const uid = userData.uid;
    const email = userData.email;

    // 2. Stats for Today/Month (matching by email for reliability)
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { count: callsToday } = await supa
      .from('call_log')
      .select('*', { count: 'exact', head: true })
      .eq('rep_id', uid)
      .gte('timestamp', today);

    const { count: apptsToday } = await supa
      .from('call_log')
      .select('*', { count: 'exact', head: true })
      .eq('rep_id', uid)
      .eq('outcome', 'callback')
      .gte('timestamp', today);

    const { count: closesMonth } = await supa
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('last_called_by_email', email)
      .eq('call_status', 'closed')
      .gte('last_called_at', firstOfMonth);

    // 4. Commissions
    const { data: commissions } = await supa
      .from('commissions')
      .select('amount, status')
      .eq('rep_id', uid);

    const earned = (commissions || [])
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    
    const pending = (commissions || [])
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    // 5. Payout History
    const { data: payouts } = await supa
      .from('payouts')
      .select('amount, paid_at')
      .eq('rep_id', uid)
      .order('paid_at', { ascending: false })
      .limit(5);

    // Calculate next payout date (e.g., every other Friday)
    const nextPayout = new Date();
    nextPayout.setDate(nextPayout.getDate() + (5 - nextPayout.getDay() + 7) % 14 || 14);

    return NextResponse.json({
      callsToday: callsToday || 0,
      appointments: apptsToday || 0,
      closes: closesMonth || 0,
      commissionEarned: earned,
      pendingCommission: pending,
      payoutHistory: (payouts || []).map(p => ({
        date: new Date(p.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: parseFloat(p.amount)
      })),
      nextPayoutDate: pending > 0 ? nextPayout.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD",
      estimatedNextPayout: pending
    });
  } catch (error: any) {
    console.error('[REP STATS API] Error:', error);
    return NextResponse.json(defaults);
  }
}
