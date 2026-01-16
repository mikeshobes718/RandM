import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supa = getSupabaseAdmin();
  console.log('[ADMIN CUSTOMERS API] Starting fetch...');
  
  try {
    // 1. Fetch all subscriptions that are active or trialing
    const { data: subsData, error: subsError } = await supa
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'trialing']);

    if (subsError) {
      console.error('[ADMIN CUSTOMERS API] Subscriptions fetch error:', subsError);
      throw subsError;
    }

    console.log(`[ADMIN CUSTOMERS API] Found ${subsData?.length || 0} subscriptions`);

    const uids = (subsData || []).map(s => s.uid);
    if (uids.length === 0) {
      return NextResponse.json({ customers: [] });
    }

    // 2. Fetch users for these subscriptions
    const { data: usersData, error: usersError } = await supa
      .from('users')
      .select('uid, email, role, created_at') // Removed last_sign_in_at which doesn't exist
      .in('uid', uids);

    if (usersError) {
      console.error('[ADMIN CUSTOMERS API] Users fetch error:', usersError);
      throw usersError;
    }

    // 3. Fetch businesses for these users
    const { data: bizData, error: bizError } = await supa
      .from('businesses')
      .select('id, name, owner_uid, created_at')
      .in('owner_uid', uids);

    if (bizError) {
      console.error('[ADMIN CUSTOMERS API] Businesses fetch error:', bizError);
      throw bizError;
    }

    const usersMap = Object.fromEntries((usersData || []).map(u => [u.uid, u]));
    const bizMap = Object.fromEntries((bizData || []).map(b => [b.owner_uid, b]));

    // Skip the leads closed-by lookup to avoid schema issues
    // This can be re-enabled once schema is stable
    const closedByMap: Record<string, string> = {};

    const customers = subsData
      .map(sub => {
        try {
          const user = usersMap[sub.uid];
          const biz = bizMap[sub.uid];
          
          if (!user) {
            console.warn(`[ADMIN CUSTOMERS API] No user found for UID ${sub.uid}`);
          }

          // EXCLUDE staff members (reps/admins) who aren't primary customers.
          if (user?.role === 'sales_rep' || user?.role === 'admin') {
            return null;
          }

          const planId = sub.plan_id?.toLowerCase() || 'starter';
          let plan = 'Starter';
          let mrrValue = 49;
          if (planId.includes('unlimited')) { plan = 'Unlimited'; mrrValue = 199; }
          else if (planId.includes('pro') || planId.includes('mid') || planId.includes('growth')) { plan = 'Small Business'; mrrValue = 99; }

          const status = sub.status === 'active' ? 'Active' : (sub.status === 'trialing' ? 'Trial' : 'Churned');
          
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
            closedBy: (biz?.name && closedByMap[biz.name.toLowerCase()]) || 'Self',
            status,
            months: monthsActive,
            lastLogin: user?.last_sign_in_at || 'Never',
            email: user?.email || 'No Email'
          };
        } catch (itemErr) {
          console.error('[ADMIN CUSTOMERS API] Error mapping customer item:', itemErr);
          return null;
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

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
