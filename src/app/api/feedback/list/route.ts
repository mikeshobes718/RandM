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
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || '60')));
  const limit = Math.min(1000, Math.max(10, Number(url.searchParams.get('limit') || '500')));
  // User's businesses
  const { data: biz } = await supa.from('businesses').select('id').eq('owner_uid', uid);
  const ids = (biz || []).map((b: { id: string }) => b.id);
  if (ids.length === 0) return NextResponse.json({ items: [] });
  // Feedback and Contact Captures may or may not exist yet; handle gracefully
  let items: any[] = [];
  try {
    const since = new Date();
    since.setUTCHours(0,0,0,0); since.setUTCDate(since.getUTCDate() - days + 1);
    
    // Fetch private feedback (1-4 stars)
    const { data: feedbackData } = await supa
      .from('feedback')
      .select('id,business_id,rating,name,email,phone,comment,marketing_consent,archived,created_at')
      .in('business_id', ids)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);
      
    // Fetch 5-star contact captures
    const { data: contactData } = await supa
      .from('review_contact_captures')
      .select('id,business_id,name,email,phone,marketing_consent:consent,created_at')
      .in('business_id', ids)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    // Fetch anonymous 5-star reviews (google_opened events without a corresponding capture)
    const { data: eventData } = await supa
      .from('review_events')
      .select('id,business_id,created_at,metadata')
      .in('business_id', ids)
      .eq('event', 'google_opened')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    const merged = [
      ...(feedbackData || []).map(f => ({ ...f, type: 'feedback' })),
      ...(contactData || []).map(c => ({ 
        ...c, 
        type: 'contact', 
        rating: 5, 
        comment: '5-star review (Contact form completed)', 
        archived: false
      })),
      ...(eventData || [])
        .filter(e => {
          // Avoid duplicates: if this event is linked to a capture we already have, skip it.
          // In practice, contact captures are separate rows, but we can check if any capture exists 
          // for the same business around the same time if we wanted to be perfect.
          // For now, let's just show all google_opened as "Anonymous 5-star review" if they don't have metadata linked to a feedback_id.
          return !e.metadata?.feedback_id;
        })
        .map(e => ({
          id: e.id,
          business_id: e.business_id,
          rating: 5,
          name: 'Anonymous Customer',
          email: null,
          phone: null,
          comment: '5-star review (Redirected to Google)',
          marketing_consent: false,
          archived: false,
          created_at: e.created_at,
          type: 'event'
        }))
    ];
    
    items = merged
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  } catch (e) {
    console.error('[FEEDBACK LIST API] Error:', e);
  }
  return NextResponse.json({ items });
}
