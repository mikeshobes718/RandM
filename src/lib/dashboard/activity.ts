import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function fetchRecentFeedback(businessId: string) {
  const supa = getSupabaseAdmin();

  const [
    { data: feedbackData },
    { data: contactData },
    { data: googleEventsSidebar },
  ] = await Promise.all([
    supa.from('feedback').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(5),
    supa.from('review_contact_captures').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(5),
    supa.from('review_events').select('id,rating,created_at').eq('business_id', businessId).eq('event', 'google_opened').order('created_at', { ascending: false }).limit(5),
  ]);

  const merged = [
    ...(feedbackData || []).map((f: any) => ({ ...f, type: 'feedback', archived: false })),
    ...(contactData || []).map((c: any) => ({ ...c, type: 'contact', rating: 5, comment: '5-star review (Contact form completed)', archived: false })),
    ...(googleEventsSidebar || []).map((e: any) => ({
      id: e.id,
      rating: (e.rating as number) || 5,
      name: 'Anonymous Customer',
      comment: `Planning to leave ${(e.rating as number) || 5}-star review on Google`,
      created_at: e.created_at,
      type: 'event',
      archived: false,
    })),
  ];

  return merged
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
}

export async function fetchActivityFeed(businessId: string) {
  const supa = getSupabaseAdmin();

  const [
    { data: eventData },
    { data: requestData },
  ] = await Promise.all([
    supa.from('review_events').select('event,created_at').eq('business_id', businessId).order('created_at', { ascending: false }).limit(10),
    supa.from('review_requests').select('created_at, status').eq('business_id', businessId).order('created_at', { ascending: false }).limit(10),
  ]);

  const eventLabels: Record<string, { icon: string; label: string }> = {
    google_opened: { icon: '⭐', label: 'Redirected to Google' },
    feedback_submitted: { icon: '✉️', label: 'New Private Feedback' },
    rating_selected: { icon: '✨', label: 'Star Rating Selected' },
    sentiment_selected: { icon: '✨', label: 'Star Rating Selected' },
    page_opened: { icon: '🌐', label: 'Review Page Opened' },
  };

  const mergedFeed = [
    ...(eventData || []).map(e => {
      const mapped = eventLabels[e.event] || { icon: '📱', label: e.event.replace(/_/g, ' ') };
      return { event: mapped.label, time: e.created_at, icon: mapped.icon };
    }),
    ...(requestData || []).map(r => ({ event: `Review Request ${r.status}`, time: r.created_at, icon: '✉️' })),
  ];

  return mergedFeed
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);
}
