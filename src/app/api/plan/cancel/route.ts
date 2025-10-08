import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let uid = await requireUid().catch(() => null);
  
  if (!uid) {
    const authHeader = req.headers.get('authorization') || '';
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
    // Check current subscription status
    const { data: subscription } = await supa
      .from('subscriptions')
      .select('status, plan_id')
      .eq('uid', uid)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return new NextResponse('No subscription found', { status: 404 });
    }

    // For Starter plan, we can "cancel" by setting status to cancelled
    // For Pro plan, we should use Stripe's cancellation flow
    if (subscription.plan_id === 'starter') {
      const { error } = await supa
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('uid', uid)
        .eq('plan_id', 'starter');

      if (error) {
        return new NextResponse(`Failed to cancel subscription: ${error.message}`, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Starter plan cancelled successfully' 
      });
    } else {
      // For Pro plans, redirect to Stripe portal for proper cancellation
      return NextResponse.json({ 
        success: false, 
        message: 'Please use the billing portal to cancel your Pro subscription',
        redirectToPortal: true
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Failed to cancel subscription: ${message}`, { status: 500 });
  }
}
