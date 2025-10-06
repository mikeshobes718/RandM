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
    .select('id,name,review_link,google_maps_write_review_uri,contact_phone,google_rating,google_place_id')
    .eq('owner_uid', uid)
    .maybeSingle();
  if (error) return new NextResponse(error.message, { status: 500 });
  if (!biz) {
    return NextResponse.json({
      business: null,
      stats: {
        reviewsThisMonth: 0,
        shareLinkScans: 0,
        averageRating: null as number | null,
      },
    });
  }

  const sinceIso = startOfCurrentMonthUTC();

  let reviewsThisMonth = 0;
  let shareLinkScans = 0;
  let averageRating: number | null = biz.google_rating ?? null;
  const formattedPhone = formatPhone(biz.contact_phone);

  try {
    const { count } = await supa
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .gte('created_at', sinceIso);
    reviewsThisMonth += count || 0;
  } catch {}

  try {
    const { count } = await supa
      .from('review_events')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .eq('event', 'google_opened')
      .gte('created_at', sinceIso);
    reviewsThisMonth += count || 0;
  } catch {}

  try {
    const { count } = await supa
      .from('review_events')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .eq('event', 'page_opened')
      .gte('created_at', sinceIso);
    shareLinkScans = count || 0;
  } catch {}

  if (averageRating == null) {
    try {
      const { data: ratingsRows } = await supa
        .from('review_events')
        .select('rating')
        .eq('business_id', biz.id)
        .not('rating', 'is', null);
      if (ratingsRows && ratingsRows.length) {
        const sum = ratingsRows.reduce((acc, row) => acc + Number(row.rating || 0), 0);
        averageRating = sum / ratingsRows.length;
      }
    } catch {}
  }

  if (averageRating == null) {
    try {
      const { data: feedbackRatings } = await supa
        .from('feedback')
        .select('rating')
        .eq('business_id', biz.id);
      if (feedbackRatings && feedbackRatings.length) {
        const sum = feedbackRatings.reduce((acc, row) => acc + Number(row.rating || 0), 0);
        averageRating = sum / feedbackRatings.length;
      }
    } catch {}
  }

  const normalizedRating =
    typeof averageRating === 'number' && Number.isFinite(averageRating)
      ? Number(averageRating.toFixed(2))
      : null;

  let recentFeedback: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    comment: string | null;
    rating: number;
    marketing_consent: boolean | null;
    created_at: string;
  }[] = [];

  try {
    const { data } = await supa
      .from('feedback')
      .select('id,name,email,phone,comment,rating,marketing_consent,created_at')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (Array.isArray(data)) {
      recentFeedback = data.map((item) => ({
        ...item,
        phone: item.phone ? formatPhone(item.phone) : item.phone,
      }));
    }
  } catch {}

  let squareConnection: {
    connected: boolean;
    sandbox?: boolean;
    lastBackfillAt?: string | null;
    defaultLocationId?: string | null;
    latestJob?: {
      id: string;
      status: string;
      createdAt: string;
      sentCount: number | null;
      totalCustomers: number | null;
    } | null;
  } = { connected: false };

  try {
    const { data: connectionRow } = await supa
      .from('square_connections')
      .select('uid,sandbox,last_backfill_at,default_location_id')
      .eq('uid', uid)
      .maybeSingle();
    if (connectionRow) {
      squareConnection = {
        connected: true,
        sandbox: Boolean(connectionRow.sandbox),
        lastBackfillAt: connectionRow.last_backfill_at ?? null,
        defaultLocationId: connectionRow.default_location_id ?? null,
        latestJob: null,
      };
      const { data: latestJob } = await supa
        .from('square_backfill_jobs')
        .select('id,status,created_at,sent_count,total_customers')
        .eq('uid', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestJob) {
        squareConnection.latestJob = {
          id: latestJob.id,
          status: latestJob.status,
          createdAt: latestJob.created_at,
          sentCount: latestJob.sent_count,
          totalCustomers: latestJob.total_customers,
        };
      }
    }
  } catch {}

  return NextResponse.json({
    business: {
      id: biz.id,
      name: biz.name,
      review_link: biz.review_link,
      google_maps_write_review_uri: biz.google_maps_write_review_uri,
      contact_phone: formattedPhone || null,
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
  });
}
