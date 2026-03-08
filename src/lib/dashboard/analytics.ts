import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function fetchProAnalytics(businessId: string, reviewsThisMonth: number) {
  const supa = getSupabaseAdmin();
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

  const [
    { data: feedbackEvents },
    { data: scanHistory },
    { count: selectionCount },
    { data: sourceData },
  ] = await Promise.all([
    supa.from('review_events').select('created_at, event, rating').eq('business_id', businessId).in('event', ['feedback_submitted', 'google_opened']).gte('created_at', thirtyDaysAgoIso),
    supa.from('review_events').select('created_at, event').eq('business_id', businessId).eq('event', 'page_opened').gte('created_at', thirtyDaysAgoIso),
    supa.from('review_events').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('event', 'rating_selected').gte('created_at', thirtyDaysAgoIso),
    supa.from('review_events').select('metadata').eq('business_id', businessId).in('event', ['google_opened', 'feedback_submitted']).gte('created_at', thirtyDaysAgoIso),
  ]);

  const dailyData: Record<string, { reviews: number; scans: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyData[d.toISOString().split('T')[0]] = { reviews: 0, scans: 0 };
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
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackEvents?.forEach(e => {
    if (e.event === 'google_opened') {
      sentiment.positive++;
      ratingDistribution[5]++;
    } else if (e.rating) {
      const r = e.rating as 1 | 2 | 3 | 4 | 5;
      ratingDistribution[r]++;
      if (e.rating >= 4) sentiment.positive++;
      else if (e.rating === 3) sentiment.neutral++;
      else sentiment.negative++;
    }
  });

  const sources: Record<string, number> = {};
  sourceData?.forEach(s => {
    let src = (s.metadata as Record<string, unknown>)?.source as string || 'direct';
    if (src.startsWith('main-qr-source-')) {
      src = src.replace('main-qr-source-', '');
    }
    sources[src] = (sources[src] || 0) + 1;
  });

  const startOfPrevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
  const endOfPrevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
  const { count: prevFeedback } = await supa.from('feedback').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('created_at', startOfPrevMonth.toISOString()).lte('created_at', endOfPrevMonth.toISOString());
  const reviewsLastMonth = prevFeedback || 0;
  const growth = reviewsLastMonth === 0 ? 100 : Math.round(((reviewsThisMonth - reviewsLastMonth) / reviewsLastMonth) * 100);

  return {
    history: Object.entries(dailyData).map(([date, vals]) => ({ date, ...vals })).sort((a, b) => a.date.localeCompare(b.date)),
    sentiment,
    ratingDistribution,
    funnel: { scans: scanHistory?.length || 0, selections: selectionCount || 0, completions: feedbackEvents?.length || 0 },
    sources,
    growth,
  };
}
