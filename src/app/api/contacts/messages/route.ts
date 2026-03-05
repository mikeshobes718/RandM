import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { ensureFeedbackTables } from '@/lib/feedbackStorage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const authAdmin = getAuthAdmin();
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const supa = getSupabaseAdmin();

    const { data: biz } = await supa
      .from('businesses')
      .select('id')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json({ error: 'Contact identifier required' }, { status: 400 });
    }

    // Ensure the table exists before querying
    try { await ensureFeedbackTables(); } catch {}

    let query = supa.from('contact_messages').select('*').eq('business_id', biz.id);
    
    if (email && phone) {
      query = query.or(`contact.eq.${email},contact.eq.${phone}`);
    } else if (email) {
      query = query.eq('contact', email);
    } else if (phone) {
      query = query.eq('contact', phone);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    // If the table doesn't exist yet, return empty instead of erroring
    if (error) {
      if (/relation|does not exist|contact_messages/.test(error.message || '')) {
        return NextResponse.json({ messages: [] });
      }
      throw error;
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err: any) {
    console.error('[contacts/messages] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
