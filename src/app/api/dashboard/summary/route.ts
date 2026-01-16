import { NextRequest, NextResponse } from 'next/server';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { formatPhone } from '@/lib/phone';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getPlaceDetails } from '@/lib/googlePlaces';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function startOfCurrentMonthUTC(): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return utc.toISOString();
}

// Force redeploy for dashboard summary sync
export async function GET(req: NextRequest) {
  try {
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

    // Fetch plan status regardless of business existence
    let isPro = false;
    let planStatus = 'none';
    try {
      const { data: subscription } = await supa
        .from('subscriptions')
        .select('status, plan_id')
        .eq('uid', uid)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Co-founder override: always PRO
      const { data: userData } = await supa.from('users').select('email').eq('uid', uid).maybeSingle();
      if (userData?.email?.toLowerCase() === 'bladespindler@gmail.com') {
        isPro = true;
        planStatus = 'active';
      } else if (subscription) {
        planStatus = subscription.status.toLowerCase();
        const planId = subscription.plan_id?.toLowerCase() || '';
        if (planStatus === 'active' && (planId.includes('pro') || planId.includes('yearly') || planId.includes('monthly'))) {
          isPro = true;
        }
      }
    } catch (e) {
      console.error('[DASHBOARD API] Error checking subscription:', e);
    }

    let biz: any = null;
    const bizResult = await supa
      .from('businesses')
      .select('id,name,review_link,google_maps_write_review_uri,google_rating,google_place_id,contact_phone,google_photo_url,address,business_type')
      .eq('owner_uid', uid)
      .maybeSingle();

    if (bizResult.error) {
      if (bizResult.error.message.includes('google_photo_url') || bizResult.error.message.includes('address') || bizResult.error.message.includes('business_type')) {
        const fallbackResult = await supa
          .from('businesses')
          .select('id,name,review_link,google_maps_write_review_uri,google_rating,google_place_id,contact_phone,google_photo_url,address')
          .eq('owner_uid', uid)
          .maybeSingle();
        if (fallbackResult.error) {
             const superFallback = await supa
              .from('businesses')
              .select('id,name,review_link,google_maps_write_review_uri,google_rating,google_place_id,contact_phone')
              .eq('owner_uid', uid)
              .maybeSingle();
             if (superFallback.error) return new NextResponse(superFallback.error.message, { status: 500 });
             biz = superFallback.data;
        } else {
             biz = fallbackResult.data;
        }
      } else {
        return new NextResponse(bizResult.error.message, { status: 500 });
      }
    } else {
      biz = bizResult.data;
    }
    
    if (!biz) {
      return NextResponse.json({
        business: null,
        stats: {
          reviewsThisMonth: 0,
          shareLinkScans: 0,
          averageRating: null,
        },
        isPro,
        planStatus
      });
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

    // Attempt to refresh Google rating if missing or zero, OR fetch missing photo/address/type
    const needsDataFromGoogle = 
      ((normalizedRating === null || normalizedRating === 0) || 
       !biz.google_photo_url || 
       !biz.address ||
       !biz.business_type) && 
      biz.google_place_id;
    
    if (needsDataFromGoogle) {
      try {
        const details = await getPlaceDetails(biz.google_place_id);
        
        const updateData: any = {};
        
        if (details?.rating != null && (normalizedRating === null || normalizedRating === 0)) {
          normalizedRating = details.rating;
          updateData.google_rating = details.rating;
        }
        
        if (!biz.google_photo_url && details?.photoUrl) {
          updateData.google_photo_url = details.photoUrl;
          biz.google_photo_url = details.photoUrl;
        }
        
        if (!biz.address && details?.formattedAddress) {
          updateData.address = details.formattedAddress;
          biz.address = details.formattedAddress;
        }

        if (!biz.business_type && details?.businessType) {
          updateData.business_type = details.businessType;
          biz.business_type = details.businessType;
        }

        if (Object.keys(updateData).length > 0) {
          try {
            await supa.from('businesses').update(updateData).eq('id', biz.id);
          } catch (dbErr) {
            console.error('[DASHBOARD API] Error updating business from Google data:', dbErr);
          }
        }
      } catch (e) {
        console.error('[DASHBOARD API] Error syncing Google data:', e);
      }
    }

    // Recent Feedback
    let recentFeedback: any[] = [];
    try {
      const { data: feedbackData } = await supa.from('feedback').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(5);
      const { data: contactData } = await supa.from('review_contact_captures').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(5);
      const { data: googleEventsSidebar } = await supa.from('review_events').select('id,rating,created_at').eq('business_id', biz.id).eq('event', 'google_opened').order('created_at', { ascending: false }).limit(5);

      const merged = [
        ...(feedbackData || []).map(f => ({ ...f, type: 'feedback', archived: false })),
        ...(contactData || []).map(c => ({ ...c, type: 'contact', rating: 5, comment: '5-star review (Contact form completed)', archived: false })),
        ...(googleEventsSidebar || []).map(e => ({ 
          id: e.id, 
          rating: e.rating || 5, // Use actual rating from event if available, default to 5
          name: 'Anonymous Customer', 
          comment: `Planning to leave ${e.rating || 5}-star review on Google`, 
          created_at: e.created_at, 
          type: 'event', 
          archived: false 
        }))
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

    // Fetch Square Connection status
    let squareConnection: any = null;
    try {
      let square: any = null;
      const result = await supa
        .from('square_connections')
        .select('access_token, last_backfill_at, is_enabled')
        .eq('business_id', biz.id)
        .maybeSingle();
      
      if (result.error?.message?.includes('is_enabled')) {
        const fallback = await supa
          .from('square_connections')
          .select('access_token, last_backfill_at')
          .eq('business_id', biz.id)
          .maybeSingle();
        square = fallback.data;
      } else {
        square = result.data;
      }
      
      if (square) {
        squareConnection = {
          connected: !!square.access_token,
          isEnabled: square.is_enabled ?? true,
          lastBackfillAt: square.last_backfill_at
        };
      }
    } catch (e) {
      console.error('[DASHBOARD API] Square status error:', e);
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
          if (e.event === 'rating_selected' || e.event === 'sentiment_selected') { icon = '✨'; label = 'Star Rating Selected'; }
          if (e.event === 'page_opened') { icon = '🌐'; label = 'Review Page Opened'; }
          return { event: label, time: e.created_at, icon };
        }),
        ...(requestData || []).map(r => ({ event: `Review Request ${r.status}`, time: r.created_at, icon: '✉️' }))
      ];
      activityFeed = mergedFeed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
    } catch (e) {}

    // Plan Limits
    let requestsUsed = 0;
    let requestsLimit = 100;
    if (planStatus === 'starter') requestsLimit = 3;
    if (planStatus === 'active') {
      const planId = (subscription?.plan_id || '').toLowerCase();
      if (planId.includes('mid') || planId.includes('growth')) requestsLimit = 100;
      else requestsLimit = 999999; // Unlimited
    }

    try {
      const startOfMonth = startOfCurrentMonthUTC();
      const { count: reqCount } = await supa
        .from('review_requests')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', biz.id)
        .gte('created_at', startOfMonth);
      requestsUsed = reqCount || 0;
    } catch (e) {}

    // Recent Campaigns (Mock for now since we don't have campaigns table yet)
    const recentCampaigns = [
      { name: 'SMS Blast - Jan 15', sent: 45, clicks: 12, date: new Date().toISOString() },
      { name: 'Email Follow-up', sent: 22, clicks: 8, date: new Date(Date.now() - 86400000).toISOString() },
    ].slice(0, 3);

    return NextResponse.json({
      business: { ...biz, contact_phone: biz.contact_phone ? formatPhone(biz.contact_phone) : null },
      stats: { reviewsThisMonth, shareLinkScans, averageRating: normalizedRating },
      recentFeedback,
      isPro,
      planStatus,
      analytics,
      squareConnection,
      activityFeed,
      planUsage: {
        used: requestsUsed,
        limit: requestsLimit,
        qrScans: shareLinkScans,
        isUnlimited: requestsLimit > 1000
      },
      recentCampaigns
    });
  } catch (err: any) {
    console.error('[DASHBOARD API] Global Crash:', err);
    return new NextResponse(`Dashboard API Error: ${err.message || 'Unknown error'}`, { status: 500 });
  }
}
// Deployment check Fri Jan  2 15:22:05 -03 2026
