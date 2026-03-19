import { NextRequest, NextResponse } from 'next/server';
import { resolveUid } from '@/lib/apiHelpers';
import { getBusinessForOwner } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { formatPhone } from '@/lib/phone';
import { getPlaceDetails } from '@/lib/googlePlaces';
import { resolvePlan, resolvePlanUsage } from '@/lib/dashboard/plan';
import { fetchMonthlyStats, fetchUsageCounts } from '@/lib/dashboard/stats';
import { fetchProAnalytics } from '@/lib/dashboard/analytics';
import { fetchRecentCampaigns, computeRates } from '@/lib/dashboard/campaigns';
import { fetchRecentFeedback, fetchActivityFeed } from '@/lib/dashboard/activity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const uid = await resolveUid(req);
    if (!uid) return new NextResponse('Unauthorized', { status: 401 });

    const { isPro, planStatus, ownerEmail, subscriptionData } = await resolvePlan(uid);

    let biz: Record<string, unknown> | null = null;
    try {
      biz = await getBusinessForOwner(uid);
    } catch (e) {
      console.error('[DASHBOARD] Business lookup error:', e);
    }

    // Auto-generate slug if missing
    if (biz && !biz.slug && biz.name) {
      const supa = getSupabaseAdmin();
      let finalSlug = (biz.name as string).toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 50) || 'business';
      try {
        let isUnique = false;
        let counter = 1;
        let testSlug = finalSlug;
        while (!isUnique && counter < 10) {
          const { data: conflict } = await supa.from('businesses').select('id').eq('slug', testSlug).maybeSingle();
          if (!conflict || conflict.id === biz.id) {
            isUnique = true;
            finalSlug = testSlug;
          } else {
            counter++;
            testSlug = `${finalSlug}-${counter}`;
          }
        }
        await supa.from('businesses').update({ slug: finalSlug }).eq('id', biz.id);
        biz.slug = finalSlug;
      } catch (e) {
        console.error('[DASHBOARD] Slug generation failed:', e);
      }
    }

    if (!biz) {
      return NextResponse.json({
        business: null,
        stats: { reviewsThisMonth: 0, shareLinkScans: 0, averageRating: null },
        isPro,
        planStatus,
      });
    }

    const businessId = biz.id as string;
    let normalizedRating = (biz.google_rating as number) ?? null;

    // Parallel data fetches
    const [
      monthlyStats,
      usageCounts,
      recentFeedback,
      activityFeed,
      recentCampaigns,
    ] = await Promise.all([
      fetchMonthlyStats(businessId).catch(e => { console.error('[DASHBOARD] Stats error:', e); return { reviewsThisMonth: 0, shareLinkScans: 0 }; }),
      fetchUsageCounts(businessId).catch(e => { console.error('[DASHBOARD] Usage error:', e); return { requestsUsed: 0, contactsCount: 0 }; }),
      fetchRecentFeedback(businessId).catch(e => { console.error('[DASHBOARD] Feedback error:', e); return []; }),
      fetchActivityFeed(businessId).catch(e => { console.error('[DASHBOARD] Activity error:', e); return []; }),
      fetchRecentCampaigns(businessId).catch(e => { console.error('[DASHBOARD] Campaigns error:', e); return []; }),
    ]);

    // Google data enrichment (non-blocking)
    const needsGoogleData =
      ((normalizedRating === null || normalizedRating === 0) || !biz.google_photo_url || !biz.address || !biz.business_type)
      && biz.google_place_id;

    if (needsGoogleData) {
      try {
        const details = await getPlaceDetails(biz.google_place_id as string);
        const updateData: Record<string, unknown> = {};

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
          const supa = getSupabaseAdmin();
          await supa.from('businesses').update(updateData).eq('id', businessId);
        }
      } catch (e) {
        console.error('[DASHBOARD] Google data sync error:', e);
      }
    }

    // Square connection (non-critical)
    let squareConnection: { connected: boolean; isEnabled?: boolean; lastBackfillAt?: string | null } | null = null;
    try {
      const supa = getSupabaseAdmin();
      const { data: square, error: sqErr } = await supa
        .from('square_connections')
        .select('access_token, last_backfill_at, is_enabled')
        .eq('business_id', businessId)
        .maybeSingle();

      if (sqErr && /is_enabled/.test(sqErr.message || '')) {
        const { data: sq2 } = await supa.from('square_connections').select('access_token, last_backfill_at').eq('business_id', businessId).maybeSingle();
        if (sq2) squareConnection = { connected: !!sq2.access_token, lastBackfillAt: sq2.last_backfill_at };
      } else if (square) {
        squareConnection = { connected: !!square.access_token, isEnabled: square.is_enabled ?? true, lastBackfillAt: square.last_backfill_at };
      }
    } catch (e) {
      console.error('[DASHBOARD] Square status error:', e);
    }

    // Analytics (pro users only)
    let analytics = null;
    if (isPro) {
      try {
        analytics = await fetchProAnalytics(businessId, monthlyStats.reviewsThisMonth);
      } catch (e) {
        console.error('[DASHBOARD] Analytics error:', e);
      }
    }

    // Compute rates
    const rates = await computeRates(businessId, recentCampaigns).catch(e => {
      console.error('[DASHBOARD] Rates error:', e);
      return { delivered: 0, click: 0, optOut: 0 };
    });

    const { requestsLimit, planName } = resolvePlanUsage(subscriptionData, planStatus);

    return NextResponse.json({
      business: { ...biz, contact_phone: biz.contact_phone ? formatPhone(biz.contact_phone as string) : null },
      stats: { reviewsThisMonth: monthlyStats.reviewsThisMonth, shareLinkScans: monthlyStats.shareLinkScans, averageRating: normalizedRating },
      recentFeedback,
      isPro,
      planStatus,
      ownerEmail,
      analytics,
      squareConnection,
      activityFeed,
      planUsage: {
        used: usageCounts.requestsUsed,
        limit: requestsLimit,
        qrScans: monthlyStats.shareLinkScans,
        isUnlimited: requestsLimit > 1000,
        planName,
        contactsCount: usageCounts.contactsCount,
      },
      recentCampaigns,
      rates,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[DASHBOARD] Global error:', message);
    return new NextResponse(`Dashboard API Error: ${message}`, { status: 500 });
  }
}
