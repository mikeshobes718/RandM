import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supa = getSupabaseAdmin();
  
  try {
    const [bizRes, usersRes, subsRes] = await Promise.all([
      supa.from('businesses').select('id, name, owner_uid, created_at'),
      supa.from('users').select('uid, email, role, last_sign_in_at'),
      supa.from('subscriptions').select('uid, status, plan_id, updated_at')
    ]);

    if (bizRes.error) throw bizRes.error;
    if (usersRes.error) throw usersRes.error;
    if (subsRes.error) throw subsRes.error;

    const businesses = bizRes.data || [];
    const users = Object.fromEntries((usersRes.data || []).map(u => [u.uid, u]));
    const subs = Object.fromEntries((subsRes.data || []).map(s => [s.uid, s]));

    // Fetch leads to see who closed them
    const { data: leads } = await supa.from('leads').select('name, last_called_by_email').eq('call_status', 'closed');
    const closedByMap = Object.fromEntries((leads || []).map(l => [l.name.toLowerCase(), l.last_called_by_email]));

    const customers = businesses.map(b => {
      const owner = users[b.owner_uid];
      const sub = subs[b.owner_uid];
      
      const planId = sub?.plan_id?.toLowerCase() || 'starter';
      let plan = 'Starter';
      let mrrValue = 49;
      if (planId.includes('unlimited')) { plan = 'Unlimited'; mrrValue = 199; }
      else if (planId.includes('pro') || planId.includes('mid') || planId.includes('growth')) { plan = 'Small Business'; mrrValue = 99; }

      const status = sub?.status === 'active' ? 'Active' : (sub?.status === 'trialing' ? 'Trial' : 'Churned');
      
      const signedUpDate = new Date(b.created_at);
      const now = new Date();
      const monthsActive = Math.max(0, (now.getFullYear() - signedUpDate.getUTCFullYear()) * 12 + (now.getMonth() - signedUpDate.getUTCMonth()));

      return {
        id: b.id,
        name: b.name,
        plan,
        mrr: `$${mrrValue}`,
        signedUp: signedUpDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        closedBy: closedByMap[b.name.toLowerCase()] || 'Self',
        status,
        months: monthsActive,
        lastLogin: owner?.last_sign_in_at || 'Never',
        email: owner?.email || 'No Email'
      };
    });

    return NextResponse.json({ customers });
  } catch (err: any) {
    console.error('[ADMIN CUSTOMERS API] Error:', err);
    return new NextResponse(err.message, { status: 500 });
  }
}
