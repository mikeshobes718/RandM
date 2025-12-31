import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const uid = await requireUid();
    const supa = getSupabaseAdmin();
    
    // Get user's business
    const { data: biz, error: bizError } = await supa
      .from('businesses')
      .select('id, name, google_place_id')
      .eq('owner_uid', uid)
      .maybeSingle();
    
    if (bizError || !biz) {
      return NextResponse.json({ error: 'Business not found', bizError }, { status: 404 });
    }
    
    // Count private feedback
    const { data: feedbackData, count: feedbackCount, error: feedbackError } = await supa
      .from('feedback')
      .select('id, rating, name, created_at', { count: 'exact' })
      .eq('business_id', biz.id);
    
    // Count contact captures
    const { data: contactData, count: contactCount, error: contactError } = await supa
      .from('review_contact_captures')
      .select('id, name, created_at', { count: 'exact' })
      .eq('business_id', biz.id);
    
    // Count review events
    const { data: eventData, count: eventCount, error: eventError } = await supa
      .from('review_events')
      .select('id, event, created_at', { count: 'exact' })
      .eq('business_id', biz.id);
    
    // Try to fetch Google reviews
    let googleReviews: any[] = [];
    let googleError: any = null;
    if (biz.google_place_id) {
      try {
        const { getPlaceReviews } = await import('@/lib/googlePlaces');
        googleReviews = await getPlaceReviews(biz.google_place_id);
      } catch (err) {
        googleError = String(err);
      }
    }
    
    // Calculate current month counts
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    const startIso = startOfMonth.toISOString();
    
    const { count: feedbackThisMonth } = await supa
      .from('review_events')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .eq('event', 'feedback_submitted')
      .gte('created_at', startIso);
    
    const { count: googleOpenedThisMonth } = await supa
      .from('review_events')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .eq('event', 'google_opened')
      .gte('created_at', startIso);
    
    const { count: scansThisMonth } = await supa
      .from('review_events')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .eq('event', 'page_opened')
      .gte('created_at', startIso);
    
    return NextResponse.json({
      business: {
        id: biz.id,
        name: biz.name,
        hasGooglePlaceId: !!biz.google_place_id,
        googlePlaceId: biz.google_place_id
      },
      database: {
        privateFeedback: {
          count: feedbackCount,
          error: feedbackError,
          sample: feedbackData?.slice(0, 3)
        },
        contactCaptures: {
          count: contactCount,
          error: contactError,
          sample: contactData?.slice(0, 3)
        },
        reviewEvents: {
          count: eventCount,
          error: eventError,
          byType: eventData?.reduce((acc: any, e: any) => {
            acc[e.event] = (acc[e.event] || 0) + 1;
            return acc;
          }, {})
        }
      },
      googleReviews: {
        count: googleReviews?.length || 0,
        error: googleError,
        sample: googleReviews?.slice(0, 3).map((r: any) => ({
          author: r.authorAttribution?.displayName,
          rating: r.rating,
          date: r.publishTime,
          text: r.text?.text?.substring(0, 100)
        }))
      },
      thisMonth: {
        startDate: startIso,
        feedbackSubmitted: feedbackThisMonth || 0,
        googleOpened: googleOpenedThisMonth || 0,
        pageScans: scansThisMonth || 0,
        totalReviews: (feedbackThisMonth || 0) + (googleOpenedThisMonth || 0)
      },
      expectedCounts: {
        feedbackPageTotalResponses: (feedbackCount || 0) + (contactCount || 0) + (googleReviews?.length || 0),
        dashboardReviewsThisMonth: (feedbackThisMonth || 0) + (googleOpenedThisMonth || 0),
        dashboardLinkScans: scansThisMonth || 0
      }
    }, { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return NextResponse.json({ error: String(err), stack: (err as Error).stack }, { status: 500 });
  }
}

