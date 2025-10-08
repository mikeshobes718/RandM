import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Unauthorized', status: 401 };
    }

    const token = authHeader.slice(7);
    const auth = getAuthAdmin();
    
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const userRecord = await auth.getUser(uid);
    
    // Check admin status
    const isAdmin = userRecord.customClaims?.admin === true;
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const userEmail = userRecord.email?.toLowerCase();
    
    if (!isAdmin && !adminEmails.includes(userEmail || '')) {
      return { error: 'Forbidden', status: 403 };
    }

    return { uid, email: userRecord.email };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { error: 'Unauthorized', status: 401 };
  }
}

export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if ('error' in authResult) {
    return new NextResponse(authResult.error, { status: authResult.status });
  }

  try {
    const supabase = getSupabaseAdmin();
    
    // Get total accounts
    const { count: totalAccounts } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('status', 'active');

    const starterCount = subscriptions?.filter(s => s.plan_id === 'starter').length || 0;
    const proCount = subscriptions?.filter(s => s.plan_id === 'pro').length || 0;

    // Get businesses count
    const { count: businessesCount } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });

    // Get businesses with Google Place ID (completed onboarding)
    const { count: completedOnboarding } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .not('google_place_id', 'is', null);

    // Get recent reviews (last 30 days) - placeholder for now
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // This would need to be implemented when reviews are stored
    const recentReviews = 0; // Placeholder

    // Calculate MRR (Monthly Recurring Revenue)
    // Pro plan pricing would need to be defined
    const proMonthlyPrice = 49.99; // Pro plan monthly price
    const mrr = proCount * proMonthlyPrice;

    // Get recent signups (last 30 days)
    const { count: recentSignups } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    const metrics = {
      totalAccounts: totalAccounts || 0,
      activeSubscriptions: {
        starter: starterCount,
        pro: proCount,
        total: starterCount + proCount
      },
      mrr,
      businessesCount: businessesCount || 0,
      completedOnboarding: completedOnboarding || 0,
      recentReviews,
      recentSignups: recentSignups || 0,
      onboardingCompletionRate: businessesCount ? Math.round((completedOnboarding || 0) / businessesCount * 100) : 0
    };

    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
