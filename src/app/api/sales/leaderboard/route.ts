import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();
  try {
    // 1. Fetch all sales reps from the users table
    const { data: reps, error: repsError } = await supa
      .from('users')
      .select('email, rep_id')
      .eq('role', 'sales_rep');

    if (repsError) throw repsError;

    if (!reps || reps.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // 2. Aggregate closes from call_log for these reps
    // We'll use the last_called_by_email to match if rep_id (UUID) is inconsistent
    const { data: logs, error: logsError } = await supa
      .from('call_log')
      .select('outcome, last_called_by_email:leads(last_called_by_email)')
      .eq('outcome', 'closed');

    if (logsError) {
      console.error('[LEADERBOARD] logs error:', logsError);
    }

    // Since our schema might have rep_id as UUID in call_log but rep_id as static string in users,
    // we'll match by email for 100% factual accuracy.
    const { data: allCloses, error: closesError } = await supa
      .from('leads')
      .select('last_called_by_email')
      .eq('call_status', 'closed');

    if (closesError) throw closesError;

    // 3. Aggregate total calls for these reps
    const { data: allCalls, error: callsError } = await supa
      .from('call_log')
      .select('rep_id, timestamp'); // In an ideal world, we'd join but let's keep it simple

    if (callsError) console.error('[LEADERBOARD] calls error:', callsError);

    // Fetch all users to match UUIDs to emails if needed
    const { data: allUsers } = await supa.from('users').select('uid, email');
    const uidToEmail = Object.fromEntries((allUsers || []).map(u => [u.uid, u.email]));

    const leaderStats = reps.map(rep => {
      const closes = (allCloses || []).filter(c => c.last_called_by_email?.toLowerCase() === rep.email?.toLowerCase()).length;
      
      const callsByUUID = (allCalls || []).filter(c => uidToEmail[c.rep_id]?.toLowerCase() === rep.email?.toLowerCase()).length;
      // Also check if any leads were logged with this email directly
      // (though call_log uses UUID, leads table has last_called_by_email)
      
      return {
        name: rep.rep_id || rep.email.split('@')[0],
        email: rep.email,
        closes: closes,
        calls: callsByUUID || 0 // Factual call count
      };
    }).sort((a, b) => b.closes - a.closes);

    return NextResponse.json({ leaderboard: leaderStats });
  } catch (error: any) {
    console.error('[LEADERBOARD API] Error:', error);
    return NextResponse.json({ leaderboard: [] });
  }
}
