import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();
  try {
    // 1. Fetch all users who have EVER logged a call, plus any designated sales reps
    const { data: allUsers } = await supa.from('users').select('uid, email, role, rep_id');
    const uidToUser = Object.fromEntries((allUsers || []).map(u => [u.uid, u]));

    // 2. Aggregate closes from leads table (most reliable factual source for closes)
    const { data: allCloses, error: closesError } = await supa
      .from('leads')
      .select('last_called_by, last_called_by_email')
      .eq('call_status', 'closed');

    if (closesError) throw closesError;

    // 3. Aggregate total calls from call_log
    const { data: allCalls, error: callsError } = await supa
      .from('call_log')
      .select('rep_id');

    if (callsError) console.error('[LEADERBOARD] calls error:', callsError);

    // 4. Group stats by user (using email as the primary key for "factual" grouping)
    const statsByEmail: Record<string, { email: string, name: string, closes: number, calls: number }> = {};

    // Initialize with all users who have a role or activity
    (allUsers || []).forEach(u => {
      if (u.role === 'sales_rep' || u.role === 'admin') {
        statsByEmail[u.email.toLowerCase()] = {
          email: u.email,
          name: u.rep_id || u.email.split('@')[0],
          closes: 0,
          calls: 0
        };
      }
    });

    // Add closes
    (allCloses || []).forEach(c => {
      const email = c.last_called_by_email?.toLowerCase();
      if (email) {
        if (!statsByEmail[email]) {
          statsByEmail[email] = { email: c.last_called_by_email, name: email.split('@')[0], closes: 0, calls: 0 };
        }
        statsByEmail[email].closes++;
      }
    });

    // Add calls
    (allCalls || []).forEach(c => {
      const user = c.rep_id ? uidToUser[c.rep_id] : null;
      const email = user?.email?.toLowerCase();
      if (email) {
        if (!statsByEmail[email]) {
          statsByEmail[email] = { email: user.email, name: user.rep_id || email.split('@')[0], closes: 0, calls: 0 };
        }
        statsByEmail[email].calls++;
      }
    });

    const leaderStats = Object.values(statsByEmail)
      .filter(s => s.calls > 0 || s.closes > 0 || (allUsers?.find(u => u.email.toLowerCase() === s.email.toLowerCase())?.role === 'sales_rep'))
      .sort((a, b) => b.closes - a.closes || b.calls - a.calls);

    return NextResponse.json({ 
      leaderboard: leaderStats.slice(0, 10), // Top 10
      total_active: leaderStats.length
    });
  } catch (error: any) {
    console.error('[LEADERBOARD API] Error:', error);
    return NextResponse.json({ leaderboard: [] });
  }
}
