import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const uid = await requireUid();
    const supa = getSupabaseAdmin();
    
    const { data: biz, error } = await supa
      .from('businesses')
      .select('*')
      .eq('owner_uid', uid)
      .maybeSingle();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      business: biz,
      columns: biz ? Object.keys(biz) : [],
      hasPhoto: !!biz?.google_photo_url,
      hasAddress: !!biz?.address,
      placeId: biz?.google_place_id || 'none'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

