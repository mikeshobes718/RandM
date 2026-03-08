import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { startOfCurrentMonthUTC } from '@/lib/apiHelpers';

export async function fetchMonthlyStats(businessId: string) {
  const supa = getSupabaseAdmin();
  const startOfMonth = startOfCurrentMonthUTC();

  const [
    { count: feedbackCount },
    { count: contactCount },
    { data: googleEvents },
    { data: contactCaptures },
    { count: scanCount },
  ] = await Promise.all([
    supa.from('feedback').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('created_at', startOfMonth),
    supa.from('review_contact_captures').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('created_at', startOfMonth),
    supa.from('review_events').select('created_at').eq('business_id', businessId).eq('event', 'google_opened').gte('created_at', startOfMonth),
    supa.from('review_contact_captures').select('created_at').eq('business_id', businessId).gte('created_at', startOfMonth),
    supa.from('review_events').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('event', 'page_opened').gte('created_at', startOfMonth),
  ]);

  let anonymousCount = 0;
  googleEvents?.forEach(e => {
    const hasContact = contactCaptures?.some(c =>
      Math.abs(new Date(c.created_at).getTime() - new Date(e.created_at).getTime()) < 10000
    );
    if (!hasContact) anonymousCount++;
  });

  const reviewsThisMonth = (feedbackCount || 0) + (contactCount || 0) + anonymousCount;
  const shareLinkScans = scanCount || 0;

  return { reviewsThisMonth, shareLinkScans };
}

export async function fetchUsageCounts(businessId: string) {
  const supa = getSupabaseAdmin();
  const startOfMonth = startOfCurrentMonthUTC();

  const [
    { count: individualRequestsUsed },
    { data: monthCampaigns },
    { count: contactsCount },
  ] = await Promise.all([
    supa.from('review_requests').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('created_at', startOfMonth),
    supa.from('campaigns').select('sent_count').eq('business_id', businessId).gte('created_at', startOfMonth),
    supa.from('contacts').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
  ]);

  const campaignRequestsUsed = monthCampaigns?.reduce((acc, c) => acc + (c.sent_count || 0), 0) || 0;
  const requestsUsed = (individualRequestsUsed || 0) + campaignRequestsUsed;

  return { requestsUsed, contactsCount: contactsCount || 0 };
}
