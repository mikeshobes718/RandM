import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supa = getSupabaseAdmin();
  console.log('[ADMIN CUSTOMERS API] ===== START =====');
  
  try {
    // 1. Fetch ALL subscriptions first
    const { data: allSubs, error: subsError } = await supa
      .from('subscriptions')
      .select('*');

    console.log('[ADMIN CUSTOMERS API] Raw query result:', { 
      count: allSubs?.length, 
      error: subsError,
      subs: allSubs 
    });

    if (subsError) {
      console.error('[ADMIN CUSTOMERS API] Subscriptions fetch error:', subsError);
      throw subsError;
    }

    // Filter for active/trialing in memory to be 100% sure
    const activeSubs = (allSubs || []).filter(s => {
      const isActive = s.status === 'active' || s.status === 'trialing' || s.status === 'trial';
      console.log(`[ADMIN CUSTOMERS API] Sub ${s.uid}: status=${s.status}, isActive=${isActive}`);
      return isActive;
    });

    console.log(`[ADMIN CUSTOMERS API] Found ${allSubs?.length || 0} total subscriptions, ${activeSubs.length} active/trial`);

    if (activeSubs.length === 0) {
      return NextResponse.json({ customers: [] });
    }

    const uids = activeSubs.map(s => s.uid).filter(Boolean);
    
    // 2. Fetch users
    const { data: usersData } = await supa
      .from('users')
      .select('uid, email, role, created_at')
      .in('uid', uids);

    // 3. Fetch businesses
    const { data: bizData } = await supa
      .from('businesses')
      .select('id, name, owner_uid, created_at')
      .in('owner_uid', uids);

    const usersMap = Object.fromEntries((usersData || []).map(u => [u.uid, u]));
    const bizMap = Object.fromEntries((bizData || []).map(b => [b.owner_uid, b]));

    const customers = activeSubs.map(sub => {
      const user = usersMap[sub.uid];
      const biz = bizMap[sub.uid];
      const role = user?.role || 'customer';

      const planId = sub.plan_id?.toLowerCase() || 'starter';
      let plan = 'Starter';
      let mrrValue = 49;
      if (planId.includes('unlimited')) { plan = 'Unlimited'; mrrValue = 199; }
      else if (planId.includes('pro') || planId.includes('mid') || planId.includes('growth')) { plan = 'Small Business'; mrrValue = 99; }

      const status = sub.status === 'active' ? 'Active' : (sub.status.startsWith('trial') ? 'Trial' : 'Churned');
      const rawDate = biz?.created_at || user?.created_at || sub.updated_at;
      const signedUpDate = rawDate ? new Date(rawDate) : new Date();
      const now = new Date();
      
      let monthsActive = 0;
      if (!isNaN(signedUpDate.getTime())) {
        monthsActive = Math.max(0, (now.getFullYear() - signedUpDate.getUTCFullYear()) * 12 + (now.getMonth() - signedUpDate.getUTCMonth()));
      }

      return {
        id: biz?.id || user?.uid || sub.uid,
        name: biz?.name || 'Pending Setup',
        plan,
        mrr: `$${mrrValue}`,
        signedUp: !isNaN(signedUpDate.getTime()) ? signedUpDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
        closedBy: 'Self',
        status,
        months: monthsActive,
        lastLogin: 'Never',
        email: user?.email || 'No Email',
        role: role
      };
    });

    console.log(`[ADMIN CUSTOMERS API] Returning ${customers.length} customers`);
    return NextResponse.json({ customers });
  } catch (err: any) {
    console.error('[ADMIN CUSTOMERS API] Global Crash:', err);
    return new NextResponse(JSON.stringify({ error: err.message || 'Internal error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
