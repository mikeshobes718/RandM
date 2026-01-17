import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supa = getSupabaseAdmin();
  console.log('[ADMIN CUSTOMERS API] ===== START =====');
  
  try {
    // 1. Fetch ALL users with role 'customer'
    const { data: customerUsers, error: usersError } = await supa
      .from('users')
      .select('uid, email, role, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    console.log('[ADMIN CUSTOMERS API] Customer users query result:', { 
      count: customerUsers?.length, 
      error: usersError
    });

    if (usersError) {
      console.error('[ADMIN CUSTOMERS API] Users fetch error:', usersError);
      throw usersError;
    }

    if (!customerUsers || customerUsers.length === 0) {
      return NextResponse.json({ customers: [] });
    }

    const uids = customerUsers.map(u => u.uid).filter(Boolean);
    
    // 2. Fetch businesses for these users
    const { data: bizData } = await supa
      .from('businesses')
      .select('id, name, owner_uid, created_at')
      .in('owner_uid', uids);

    // 3. Fetch subscriptions for these users
    const { data: subsData } = await supa
      .from('subscriptions')
      .select('*')
      .in('uid', uids);

    const bizMap = Object.fromEntries((bizData || []).map(b => [b.owner_uid, b]));
    const subsMap = Object.fromEntries((subsData || []).map(s => [s.uid, s]));

    const customers = customerUsers.map(user => {
      const biz = bizMap[user.uid];
      const sub = subsMap[user.uid];

      const planId = sub?.plan_id?.toLowerCase() || 'starter';
      let plan = 'Starter';
      let mrrValue = 49;
      if (planId.includes('unlimited')) { plan = 'Unlimited'; mrrValue = 199; }
      else if (planId.includes('pro') || planId.includes('mid') || planId.includes('growth')) { plan = 'Small Business'; mrrValue = 99; }

      const status = sub?.status === 'active' ? 'Active' : (sub?.status?.startsWith('trial') ? 'Trial' : 'No Subscription');
      const rawDate = biz?.created_at || user.created_at;
      const signedUpDate = rawDate ? new Date(rawDate) : new Date();
      const now = new Date();
      
      let monthsActive = 0;
      if (!isNaN(signedUpDate.getTime())) {
        monthsActive = Math.max(0, (now.getFullYear() - signedUpDate.getUTCFullYear()) * 12 + (now.getMonth() - signedUpDate.getUTCMonth()));
      }

      console.log(`[ADMIN CUSTOMERS API] Building customer for user ${user.uid}:`, {
        hasBiz: !!biz,
        hasSub: !!sub,
        email: user.email,
        bizName: biz?.name
      });

      // Use signup date as a proxy for activity since last_sign_in_at doesn't exist
      // Return ISO string so frontend can format it with formatDistanceToNow
      const lastLogin = user.created_at || null;

      return {
        id: biz?.id || user.uid,
        name: biz?.name || user.email || 'No Business Name',
        plan,
        mrr: sub ? `$${mrrValue}` : '$0',
        signedUp: !isNaN(signedUpDate.getTime()) ? signedUpDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
        closedBy: 'Self',
        status,
        months: monthsActive,
        lastLogin,
        email: user.email || 'No Email',
        role: user.role
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
