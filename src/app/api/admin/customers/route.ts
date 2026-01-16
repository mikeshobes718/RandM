import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supa = getSupabaseAdmin();
  
  try {
    // 1. Fetch all subscriptions that are active or trialing
    const { data: subsData, error: subsError } = await supa
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'trialing']);

    if (subsError) throw subsError;

    const uids = (subsData || []).map(s => s.uid);
    if (uids.length === 0) {
      return NextResponse.json({ customers: [] });
    }

    // 2. Fetch users for these subscriptions
    const { data: usersData, error: usersError } = await supa
      .from('users')
      .select('uid, email, role, last_sign_in_at, created_at')
      .in('uid', uids);

    if (usersError) throw usersError;

    // 3. Fetch businesses for these users
    const { data: bizData, error: bizError } = await supa
      .from('businesses')
      .select('id, name, owner_uid, created_at')
      .in('owner_uid', uids);

    if (bizError) throw bizError;

    const usersMap = Object.fromEntries((usersData || []).map(u => [u.uid, u]));
    const bizMap = Object.fromEntries((bizData || []).map(b => [b.owner_uid, b]));

    // Fetch leads to see who closed them
    const { data: leads } = await supa.from('leads').select('name, last_called_by_email').eq('call_status', 'closed');
    const closedByMap = Object.fromEntries((leads || []).map(l => [l.name.toLowerCase(), l.last_called_by_email]));

    const customers = subsData
      .map(sub => {
        const user = usersMap[sub.uid];
        const biz = bizMap[sub.uid];
        
        // APPLY USER LOGIC: "as long as theyre not marked as customer on the sales rep part of admin"
        // This means we only show them if their role is NOT 'customer'
        if (user?.role === 'customer') return null;

        const planId = sub.plan_id?.toLowerCase() || 'starter';
        let plan = 'Starter';
        let mrrValue = 49;
        if (planId.includes('unlimited')) { plan = 'Unlimited'; mrrValue = 199; }
        else if (planId.includes('pro') || planId.includes('mid') || planId.includes('growth')) { plan = 'Small Business'; mrrValue = 99; }

        const status = sub.status === 'active' ? 'Active' : (sub.status === 'trialing' ? 'Trial' : 'Churned');
        
        const signedUpDate = new Date(biz?.created_at || user?.created_at || sub.updated_at);
        const now = new Date();
        const monthsActive = Math.max(0, (now.getFullYear() - signedUpDate.getUTCFullYear()) * 12 + (now.getMonth() - signedUpDate.getUTCMonth()));

        return {
          id: biz?.id || user?.uid || sub.uid,
          name: biz?.name || 'Pending Setup',
          plan,
          mrr: `$${mrrValue}`,
          signedUp: signedUpDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          closedBy: (biz && closedByMap[biz.name.toLowerCase()]) || 'Self',
          status,
          months: monthsActive,
          lastLogin: user?.last_sign_in_at || 'Never',
          email: user?.email || 'No Email'
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    return NextResponse.json({ customers });
  } catch (err: any) {
    console.error('[ADMIN CUSTOMERS API] Error:', err);
    return new NextResponse(err.message, { status: 500 });
  }
}
