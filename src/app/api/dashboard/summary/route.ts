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

  // Basic Stats
  let reviewsThisMonth = 0;
  let shareLinkScans = 0;
  let normalizedRating = biz.google_rating ?? null;
  const now = new Date();

  try {
    const startOfMonth = startOfCurrentMonthUTC();
    
    // 1. New Feedback (Private)
    const { count: feedbackCount } = await supa
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .gte('created_at', startOfMonth);
      
    // 2. New Contact Captures (Leads)
    const { count: contactCount } = await supa
      .from('review_contact_captures')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .gte('created_at', startOfMonth);

    // 3. New Anonymous Redirects (Events)
    const { data: googleEvents } = await supa
      .from('review_events')
      .select('created_at')
      .eq('business_id', biz.id)
      .eq('event', 'google_opened')
      .gte('created_at', startOfMonth);
    
    const { data: contactCaptures } = await supa
      .from('review_contact_captures')
      .select('created_at')
      .eq('business_id', biz.id)
      .gte('created_at', startOfMonth);

    let anonymousCount = 0;
    googleEvents?.forEach(e => {
      const hasContact = contactCaptures?.some(c => 
        Math.abs(new Date(c.created_at).getTime() - new Date(e.created_at).getTime()) < 10000
      );
      if (!hasContact) anonymousCount++;
    });

    reviewsThisMonth = (feedbackCount || 0) + (contactCount || 0) + anonymousCount;

    // Link scans THIS MONTH
    const { count: scanCount } = await supa
      .from('review_events')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .eq('event', 'page_opened')
      .gte('created_at', startOfMonth);
    shareLinkScans = scanCount || 0;
  } catch (e) {
    console.error('[DASHBOARD API] Error fetching stats:', e);
  }

  // Attempt to refresh Google rating if missing or zero
  if ((normalizedRating === null || normalizedRating === 0) && biz.google_place_id) {
    try {
      const { getPlaceDetails } = await import('@/lib/googlePlaces');
      const details = await getPlaceDetails(biz.google_place_id);
      console.log('[DASHBOARD API] Place details for rating refresh:', { 
        placeId: biz.google_place_id, 
        rating: details?.rating,
        displayName: details?.displayName?.text,
        types: details?.types 
      });
      if (details?.rating != null) {
        normalizedRating = details.rating;
        await supa.from('businesses').update({ google_rating: details.rating }).eq('id', biz.id);
        console.log('[DASHBOARD API] Successfully updated rating:', details.rating);
      } else {
        console.log('[DASHBOARD API] No rating available - place may not be a business or has no reviews yet');
      }
    } catch (e) {
      console.error('[DASHBOARD API] Error refreshing rating:', e);
    }
  }

  // Recent Feedback
  let recentFeedback: any[] = [];
  try {
    const { data: feedbackData } = await supa.from('feedback').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(5);
    const { data: contactData } = await supa.from('review_contact_captures').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(5);
    const { data: googleEventsSidebar } = await supa.from('review_events').select('*').eq('business_id', biz.id).eq('event', 'google_opened').order('created_at', { ascending: false }).limit(5);

    const merged = [
      ...(feedbackData || []).map(f => ({ ...f, type: 'feedback', archived: false })),
      ...(contactData || []).map(c => ({ ...c, type: 'contact', rating: 5, comment: '5-star review (Contact form completed)', archived: false })),
      ...(googleEventsSidebar || []).map(e => ({ id: e.id, rating: 5, name: 'Anonymous Customer', comment: 'Redirected to Google for review', created_at: e.created_at, type: 'event', archived: false }))
    ];
    
    recentFeedback = merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  } catch (e) {}

  // Pro Analytics
  let analytics: any = null;
  if (isPro) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

      const { data: feedbackEvents } = await supa.from('review_events').select('created_at, event, rating').eq('business_id', biz.id).in('event', ['feedback_submitted', 'google_opened']).gte('created_at', thirtyDaysAgoIso);
      const { data: scanHistory } = await supa.from('review_events').select('created_at, event').eq('business_id', biz.id).eq('event', 'page_opened').gte('created_at', thirtyDaysAgoIso);

      const dailyData: Record<string, { reviews: number; scans: number }> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyData[dateStr] = { reviews: 0, scans: 0 };
      }

      feedbackEvents?.forEach(e => {
        const dateStr = e.created_at.split('T')[0];
        if (dailyData[dateStr]) dailyData[dateStr].reviews++;
      });
      scanHistory?.forEach(s => {
        const dateStr = s.created_at.split('T')[0];
        if (dailyData[dateStr]) dailyData[dateStr].scans++;
      });

      const sentiment = { positive: 0, neutral: 0, negative: 0 };
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      feedbackEvents?.forEach(e => {
        if (e.event === 'google_opened') {
          sentiment.positive++;
          ratingDistribution[5]++;
        } else if (e.rating) {
          const r = e.rating as 1|2|3|4|5;
          ratingDistribution[r]++;
          if (e.rating >= 4) sentiment.positive++;
          else if (e.rating === 3) sentiment.neutral++;
          else sentiment.negative++;
        }
      });

      const { count: selectionCount } = await supa.from('review_events').select('*', { count: 'exact', head: true }).eq('business_id', biz.id).eq('event', 'rating_selected').gte('created_at', thirtyDaysAgoIso);
      const { data: sourceData } = await supa.from('review_events').select('metadata').eq('business_id', biz.id).in('event', ['google_opened', 'feedback_submitted']).gte('created_at', thirtyDaysAgoIso);
      
      const sources: Record<string, number> = {};
      sourceData?.forEach(s => {
        const src = (s.metadata as any)?.source || 'direct';
        sources[src] = (sources[src] || 0) + 1;
      });

      // Growth
      const startOfPrevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
      const endOfPrevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
      const { count: prevFeedback } = await supa.from('feedback').select('*', { count: 'exact', head: true }).eq('business_id', biz.id).gte('created_at', startOfPrevMonth.toISOString()).lte('created_at', endOfPrevMonth.toISOString());
      const reviewsLastMonth = prevFeedback || 0;
      const growth = reviewsLastMonth === 0 ? 100 : Math.round(((reviewsThisMonth - reviewsLastMonth) / reviewsLastMonth) * 100);

      analytics = {
        history: Object.entries(dailyData).map(([date, vals]) => ({ date, ...vals })).sort((a, b) => a.date.localeCompare(b.date)),
        sentiment,
        ratingDistribution,
        funnel: { scans: scanHistory?.length || 0, selections: selectionCount || 0, completions: feedbackEvents?.length || 0 },
        sources,
        growth
      };
    } catch (e) {
      console.error('[DASHBOARD API] Analytics error:', e);
    }
  }

  // Activity Feed
  let activityFeed: any[] = [];
  try {
    const { data: eventData } = await supa.from('review_events').select('event,created_at').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(10);
    const { data: requestData } = await supa.from('review_requests').select('created_at, status').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(10);

    const mergedFeed = [
      ...(eventData || []).map(e => {
        let icon = '📱', label = e.event.replace(/_/g, ' ');
        if (e.event === 'google_opened') { icon = '⭐'; label = 'Redirected to Google'; }
        if (e.event === 'feedback_submitted') { icon = '✉️'; label = 'New Private Feedback'; }
        if (e.event === 'rating_selected') { icon = '✨'; label = 'Rating Selected'; }
        if (e.event === 'page_opened') { icon = '🌐'; label = 'Review Page Opened'; }
        return { event: label, time: e.created_at, icon };
      }),
      ...(requestData || []).map(r => ({ event: `Review Request ${r.status}`, time: r.created_at, icon: '✉️' }))
    ];
    activityFeed = mergedFeed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
  } catch (e) {}

  return NextResponse.json({
    business: { ...biz, contact_phone: biz.contact_phone ? formatPhone(biz.contact_phone) : null },
    stats: { reviewsThisMonth, shareLinkScans, averageRating: normalizedRating },
    recentFeedback,
    isPro,
    analytics,
    activityFeed
  });
}
