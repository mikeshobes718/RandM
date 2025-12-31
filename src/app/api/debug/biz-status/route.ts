import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getPlaceDetails } from '@/lib/googlePlaces';

export async function GET(req: NextRequest) {
  const supa = getSupabaseAdmin();
  const { data: user } = await supa.from('users').select('uid').eq('email', 'volurer295@ovbest.com').maybeSingle();
  if (!user) return NextResponse.json({ error: 'User not found' });

  const { data: biz } = await supa.from('businesses').select('*').eq('owner_uid', user.uid).maybeSingle();
  if (!biz) return NextResponse.json({ error: 'Business not found' });

  let freshDetails = null;
  if (biz.google_place_id) {
    try {
      freshDetails = await getPlaceDetails(biz.google_place_id);
    } catch (e: any) {
      freshDetails = { error: e.message };
    }
  }

  return NextResponse.json({
    business: biz,
    freshDetails
  });
}

