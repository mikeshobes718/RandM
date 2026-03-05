import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

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
    const contact = searchParams.get('contact');

    if (!contact) {
      return NextResponse.json({ error: 'Contact identifier required' }, { status: 400 });
    }

    const { data, error } = await supa
      .from('contact_messages')
      .select('*')
      .eq('business_id', biz.id)
      .eq('contact', contact)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ messages: data });
  } catch (err: any) {
    console.error('[contacts/messages] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
