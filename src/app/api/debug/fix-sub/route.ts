import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  
  if (!email) return new NextResponse('Missing email', { status: 400 });
  
  const supa = getSupabaseAdmin();
  const { data: user } = await supa.from('users').select('uid').eq('email', email).maybeSingle();
  
  if (!user) return NextResponse.json({ error: 'User not found' });
  
  // Update subscription to be active and far in the future
  const { error } = await supa.from('subscriptions').upsert({
    uid: user.uid,
    status: 'active',
    plan_id: 'price_pro_manual',
    current_period_end: '2030-01-01T00:00:00Z',
    updated_at: new Date().toISOString()
  });
  
  if (error) return NextResponse.json({ error: error.message });
  
  return NextResponse.json({ success: true, message: `Subscription updated for ${email}` });
}


