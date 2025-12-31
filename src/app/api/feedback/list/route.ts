import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const uid = await requireUid().catch(() => null);
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

    const merged = [
      ...(feedbackData || []).map(f => ({ ...f, type: 'feedback' })),
      ...(contactData || []).map(c => ({ 
        ...c, 
        type: 'contact', 
        rating: 5, 
        comment: '5-star review lead', 
        archived: false // Contact captures don't have an archived column yet, default to false
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
