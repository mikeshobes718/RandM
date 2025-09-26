import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get('email') || '').toLowerCase();
  const token = req.headers.get('x-admin-token') || '';
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return new NextResponse('forbidden', { status: 403 });
  }
  if (!email) return new NextResponse('missing email', { status: 400 });
  const supa = getSupabaseAdmin();
  const { data: user } = await supa.from('users').select('uid,email').eq('email', email).maybeSingle();
  if (!user?.uid) return NextResponse.json({ email, exists: false, hasBusiness: false, plan: 'none' });
  const uid = user.uid as string;
  const { data: biz } = await supa.from('businesses').select('id,name,created_at').eq('owner_uid', uid);
  const { data: sub } = await supa
    .from('subscriptions')
    .select('status, updated_at')
    .eq('uid', uid)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const plan = (sub?.status as string | undefined) || 'none';
  return NextResponse.json({
    email,
    uid,
    exists: true,
    plan,
    pro: ['active','trialing'].includes(plan),
    hasBusiness: Array.isArray(biz) && biz.length > 0,
    businessCount: Array.isArray(biz) ? biz.length : 0,
    businesses: biz || [],
  });
}

