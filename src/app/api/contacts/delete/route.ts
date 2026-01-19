import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const authAdmin = getAuthAdmin();
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { contactIds, all } = body;

    const supa = getSupabaseAdmin();

    // Get the user's business
    const { data: biz } = await supa
      .from('businesses')
      .select('id')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    if (all) {
      // Delete all contacts for this business
      const { error } = await supa
        .from('contacts')
        .delete()
        .eq('business_id', biz.id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'All contacts deleted' });
    }

    if (!contactIds || !Array.isArray(contactIds)) {
      return NextResponse.json({ error: 'No contact IDs provided' }, { status: 400 });
    }

    // Delete specific contacts
    const { error } = await supa
      .from('contacts')
      .delete()
      .eq('business_id', biz.id)
      .in('id', contactIds);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `${contactIds.length} contacts deleted successfully` 
    });
  } catch (error: any) {
    console.error('[CONTACTS DELETE API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
