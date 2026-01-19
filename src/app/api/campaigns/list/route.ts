import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    const supa = getSupabaseAdmin();

    // Get the user's business
    const { data: biz } = await supa
      .from('businesses')
      .select('id')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ campaigns: [] });
    }

    // Fetch campaigns
    const { data: campaigns, error } = await supa
      .from('campaigns')
      .select('*')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message.includes('does not exist')) {
        return NextResponse.json({ campaigns: [] });
      }
      throw error;
    }

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (error: any) {
    console.error('[CAMPAIGNS LIST API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
