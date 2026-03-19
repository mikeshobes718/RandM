import { NextResponse } from 'next/server';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  let uid = await requireUid().catch(() => null);
  let email = '';

  console.log('[API/PLAN/STATUS] Initial UID from cookie:', uid);

  if (!uid) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
    if (token) {
      try {
        const decoded = await verifyIdTokenViaRest(token);
        uid = decoded.uid;
        email = (decoded as any).email || '';
        console.log('[API/PLAN/STATUS] UID from Bearer:', uid, 'Email:', email);
      } catch (e) {
        console.error('[API/PLAN/STATUS] Bearer token decode failed:', e);
      }
    }
  }

  if (uid && !email) {
    try {
      const auth = getAuthAdmin();
      const user = await auth.getUser(uid);
      email = user.email || '';
      console.log('[API/PLAN/STATUS] Email from Firebase Admin:', email);
    } catch (e) {
      console.error('[API/PLAN/STATUS] Firebase Admin getUser failed:', e);
    }
  }

  if (!uid) {
    console.warn('[API/PLAN/STATUS] No UID found, returning 401');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Co-founder override
  const coFounders = ['bladespindler@gmail.com', 'volurer295@ovbest.com', 'mikebobby718@gmail.com'];
  if (email && coFounders.includes(email.toLowerCase())) {
    console.log('[API/PLAN/STATUS] Override triggered for:', email);
    return NextResponse.json({ status: 'active', plan: 'pro' });
  }

  console.log('[API/PLAN/STATUS] Proceeding to database check for UID:', uid);

  let data = null;
  let error = null;
  const supa = getSupabaseAdmin();
  try {
    const result = await supa
      .from('subscriptions')
      .select('status, plan_id, updated_at')
      .eq('uid', uid)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    data = result.data;
    error = result.error;
  } catch (err) {
    console.error('[API/PLAN/STATUS] Supabase error:', err);
  }
  
  if (error) {
    console.error('[API/PLAN/STATUS] Subscriptions fetch error:', error);
    // Don't return 500, just continue to fallbacks
  }
  const rawStatus = (data?.status as string | undefined) || 'none';
  const planId = (data?.plan_id as string | undefined) || null;
  
  // If no subscription found, check if user has a business (indicates starter plan)
  if (!data) {
    try {
      const { data: business } = await supa
        .from('businesses')
        .select('id')
        .eq('owner_uid', uid)
        .maybeSingle();
      
      if (business) {
        return NextResponse.json({ status: 'starter', plan: 'starter' });
      }
    } catch (businessError) {
      console.error('Error checking business:', businessError);
    }
  }
  
  const normalizedStatus = planId === 'starter' && rawStatus.toLowerCase() === 'active' ? 'starter' : rawStatus;
  return NextResponse.json({ status: normalizedStatus, plan: planId });
}
