import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) return new NextResponse('Missing email', { status: 400 });
    const supa = getSupabaseAdmin();
    const { data: user } = await supa.from('users').select('uid').eq('email', email).maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' });
    
    // Explicitly select the new columns to see if they exist
    const { data: biz, error: bizError } = await supa.from('businesses')
      .select('id, name, google_photo_url, address')
      .eq('owner_uid', user.uid)
      .maybeSingle();
    
    return NextResponse.json({ uid: user.uid, biz, bizError });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
// deployment retry
