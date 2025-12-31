import { NextResponse } from 'next/server';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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
  const url = new URL(req.url);
  const days = Math.min(10000, Math.max(1, Number(url.searchParams.get('days') || '90')));
  const limit = Math.min(5000, Math.max(10, Number(url.searchParams.get('limit') || '500')));
  
  // User's businesses
  const { data: biz } = await supa.from('businesses').select('id, google_place_id').eq('owner_uid', uid);
  const ids = (biz || []).map((b: { id: string }) => b.id);
  if (ids.length === 0) return NextResponse.json({ items: [] });

  let items: any[] = [];
  try {
    const since = new Date();
    since.setUTCHours(0,0,0,0); since.setUTCDate(since.getUTCDate() - days + 1);
    
    // 1. Fetch private feedback (1-4 stars)
    const { data: feedbackData } = await supa
      .from('feedback')
      .select('id,business_id,rating,name,email,phone,comment,marketing_consent,created_at')
      .in('business_id', ids)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);
      
    // 2. Fetch 5-star contact captures
    const { data: contactData } = await supa
      .from('review_contact_captures')
      .select('id,business_id,name,email,phone,marketing_consent:consent,created_at')
      .in('business_id', ids)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    // 3. Fetch "google_opened" events for anonymous entries
    const { data: googleEvents } = await supa
      .from('review_events')
      .select('id,business_id,created_at')
      .in('business_id', ids)
      .eq('event', 'google_opened')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    // 4. Fetch actual Google Reviews
    const googleReviews: any[] = [];
    for (const b of (biz || [])) {
      if (b.google_place_id) {
        try {
          const { getPlaceReviews } = await import('@/lib/googlePlaces');
          const reviews = await getPlaceReviews(b.google_place_id);
          googleReviews.push(...(reviews || []).map((r: any) => ({
            id: `google-${r.name || Math.random()}`,
            business_id: b.id,
            rating: r.rating || 5,
            name: r.authorAttribution?.displayName || 'Google Reviewer',
            email: null,
            phone: null,
            comment: r.text?.text || '(No comment)',
            marketing_consent: false,
            archived: false,
            created_at: r.publishTime || new Date().toISOString(),
            type: 'google'
          })));
        } catch (err) {}
      }
    }

    // Merge everything
    const merged = [
      ...(feedbackData || []).map(f => ({ ...f, type: 'feedback', archived: f.archived ?? false })),
      ...(contactData || []).map(c => ({ 
        ...c, 
        type: 'contact', 
        rating: 5, 
        comment: '5-star review (Contact form completed)', 
        archived: c.archived ?? false
      })),
      ...(googleEvents || []).map(e => ({
        id: e.id,
        business_id: e.business_id,
        rating: 5,
        name: null,
        email: null,
        phone: null,
        comment: null,
        marketing_consent: false,
        archived: false,
        created_at: e.created_at,
        type: 'event'
      })),
      ...googleReviews
    ];
    
    // Deduplicate: If an event and a contact capture happen within 10s, skip the event
    const finalItems = [];
    const sorted = merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    for (const item of sorted) {
      if (item.type === 'event') {
        const hasContact = contactData?.some(c => 
          Math.abs(new Date(c.created_at).getTime() - new Date(item.created_at).getTime()) < 10000
        );
        if (hasContact) continue;
      }
      finalItems.push(item);
    }

    items = finalItems.slice(0, limit);
  } catch (e) {
    console.error('[FEEDBACK LIST API] Error:', e);
  }
  
  return NextResponse.json({ items });
}
