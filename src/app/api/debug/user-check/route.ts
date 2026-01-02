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
    const { data: biz } = await supa.from('businesses').select('*').eq('owner_uid', user.uid).maybeSingle();
    return NextResponse.json({ biz });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
