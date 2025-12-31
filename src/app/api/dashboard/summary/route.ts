import { NextRequest, NextResponse } from 'next/server';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { formatPhone } from '@/lib/phone';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function startOfCurrentMonthUTC(): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return utc.toISOString();
}

export async function GET(req: NextRequest) {
  // Try cookie-based auth first, then fallback to Authorization header
  let uid = await requireUid().catch(() => null);
  
  if (!uid) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (token) {
      try {
        const auth = getAuthAdmin();
        const decoded = await auth.verifyIdToken(token);
        uid = decoded.uid;
      } catch {
        try {
          const verified = await verifyIdTokenViaRest(token);
          uid = verified.uid;
        } catch {}
      }
    }
  }
  
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const supa = getSupabaseAdmin();
  const { data: biz, error } = await supa
    .from('businesses')
    .select('id,name,review_link,google_maps_write_review_uri,google_rating,google_place_id,contact_phone')
    .eq('owner_uid', uid)
    .maybeSingle();

  if (error) return new NextResponse(error.message, { status: 500 });
  if (!biz) {
    return NextResponse.json({
      business: null,
      stats: {
        reviewsThisMonth: 0,
        shareLinkScans: 0,
        averageRating: null,
      },
    });
  }

  // Fetch plan status to check if Pro
  let isPro = false;
  try {
    const { data: subscription } = await supa
      .from('subscriptions')
      .select('status, plan_id')
      .eq('uid', uid)
      .maybeSingle();
    
    if (subscription && subscription.status === 'active') {
      const planId = subscription.plan_id?.toLowerCase() || '';
      if (planId.includes('pro') || planId.includes('yearly') || planId.includes('monthly')) {
        isPro = true;
      }
    }
  } catch (e) {
    console.error('[DASHBOARD API] Error checking subscription:', e);
  }

  const sinceIso = startOfCurrentMonthUTC();

  // Basic Stats
  let reviewsThisMonth = 0;
  let shareLinkScans = 0;
  let normalizedRating = biz.google_rating ?? null;

  try {
    // Current month reviews
    const { count: reviewCount } = await supa
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .gte('created_at', sinceIso);
    reviewsThisMonth = reviewCount || 0;

    // Total scans
    const { count: scanCount } = await supa
      .from('review_events')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .eq('event', 'page_opened');
    shareLinkScans = scanCount || 0;
  } catch (e) {
    console.error('[DASHBOARD API] Error fetching stats:', e);
  }

  // Recent Feedback
  let recentFeedback: any[] = [];
  try {
    const { data } = await supa
      .from('feedback')
      .select('*')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })
      .limit(5);
    recentFeedback = data || [];
  } catch (e) {}

  // Square connection status
  let squareConnection = { connected: false };
  try {
    const { count } = await supa
      .from('square_connections')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id);
    squareConnection.connected = (count || 0) > 0;
  } catch (e) {}

  // Advanced Analytics for Pro Users
  let analytics: any = null;
  if (isPro) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

      const { data: feedbackHistory } = await supa
        .from('feedback')
        .select('created_at, rating')
        .eq('business_id', biz.id)
        .gte('created_at', thirtyDaysAgoIso);

      const { data: scanHistory } = await supa
        .from('review_events')
        .select('created_at, event')
        .eq('business_id', biz.id)
        .eq('event', 'page_opened')
        .gte('created_at', thirtyDaysAgoIso);

      const dailyData: Record<string, { reviews: number; scans: number }> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyData[dateStr] = { reviews: 0, scans: 0 };
      }

      feedbackHistory?.forEach(f => {
        const dateStr = f.created_at.split('T')[0];
        if (dailyData[dateStr]) dailyData[dateStr].reviews++;
      });

      scanHistory?.forEach(s => {
        const dateStr = s.created_at.split('T')[0];
        if (dailyData[dateStr]) dailyData[dateStr].scans++;
      });

      const sentiment = { positive: 0, neutral: 0, negative: 0 };
      feedbackHistory?.forEach(f => {
        if (f.rating >= 4) sentiment.positive++;
        else if (f.rating === 3) sentiment.neutral++;
        else sentiment.negative++;
      });

      analytics = {
        history: Object.entries(dailyData)
          .map(([date, vals]) => ({ date, ...vals }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        sentiment
      };
    } catch (e) {
      console.error('[DASHBOARD API] Analytics error:', e);
    }
  }

  const formattedPhone = biz.contact_phone ? formatPhone(biz.contact_phone) : null;

  return NextResponse.json({
    business: {
      id: biz.id,
      name: biz.name,
      review_link: biz.review_link,
      google_maps_write_review_uri: biz.google_maps_write_review_uri,
      contact_phone: formattedPhone,
      google_rating: biz.google_rating,
      google_place_id: biz.google_place_id,
    },
    stats: {
      reviewsThisMonth,
      shareLinkScans,
      averageRating: normalizedRating,
    },
    recentFeedback,
    squareConnection,
    isPro,
    analytics
  });
}
