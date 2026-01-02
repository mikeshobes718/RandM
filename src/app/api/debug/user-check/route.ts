import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) return new NextResponse('Missing email', { status: 400 });
    
    console.log('[DEBUG] Checking user for email:', email);
    const supa = getSupabaseAdmin();
    const { data: user, error: userError } = await supa.from('users').select('uid').eq('email', email).maybeSingle();
    
    if (userError) throw userError;
    if (!user) return NextResponse.json({ error: 'User not found in users table' });
    
    console.log('[DEBUG] Found UID:', user.uid);
    const { data: subs, error: subsError } = await supa.from('subscriptions').select('*').eq('uid', user.uid).order('updated_at', { ascending: false });
    if (subsError) throw subsError;

    const { data: biz, error: bizError } = await supa.from('businesses').select('*').eq('owner_uid', user.uid).maybeSingle();
    if (bizError) throw bizError;
    
    return NextResponse.json({ uid: user.uid, subs, biz });
  } catch (err: any) {
    console.error('[DEBUG] Error checking user:', err);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}

