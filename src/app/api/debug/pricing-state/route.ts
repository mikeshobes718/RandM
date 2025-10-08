import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  let uid = await requireUid().catch(() => null);
  
  if (!uid) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
    if (token) {
      try {
        const { verifyIdTokenViaRest } = await import('@/lib/authServer');
        uid = (await verifyIdTokenViaRest(token)).uid;
      } catch {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }
  }
  
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const supa = getSupabaseAdmin();
  
  try {
    // Get subscription status
    const { data: subscription } = await supa
      .from('subscriptions')
      .select('status, plan_id, updated_at')
      .eq('uid', uid)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get business status
    const { data: business } = await supa
      .from('businesses')
      .select('*')
      .eq('owner_uid', uid)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const rawStatus = (subscription?.status as string | undefined) || 'none';
    const planId = (subscription?.plan_id as string | undefined) || null;
    const normalizedStatus = planId === 'starter' && rawStatus.toLowerCase() === 'active' ? 'starter' : rawStatus;
    
    const hasBusinessData = Boolean(business);
    const isOnboardingComplete = hasBusinessData && business?.google_place_id;
    
    const debugInfo = {
      uid,
      subscription: {
        status: rawStatus,
        planId,
        normalizedStatus
      },
      business: {
        exists: hasBusinessData,
        onboardingComplete: isOnboardingComplete,
        googlePlaceId: business?.google_place_id || null,
        businessName: business?.business_name || null
      },
      computed: {
        starterActive: normalizedStatus === 'starter',
        shouldShowCompleteSetup: normalizedStatus === 'starter' && !isOnboardingComplete,
        shouldShowManagePlan: normalizedStatus === 'starter' && isOnboardingComplete
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Debug failed: ${message}`, { status: 500 });
  }
}
