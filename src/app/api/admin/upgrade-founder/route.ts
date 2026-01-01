import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  
  if (secret !== 'upgrade_founder_2026') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const email = 'Bladespindler@gmail.com';
  const supa = getSupabaseAdmin();
  const auth = getAuthAdmin();

  try {
    // 1. Get user from Firebase
    let uid = '';
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (err) {
      return NextResponse.json({ success: false, error: 'User not found in Firebase' });
    }

    // 2. Ensure user exists in Supabase
    await supa.from('users').upsert({ uid, email });

    // 3. Upsert Pro subscription
    const { error: subError } = await supa
      .from('subscriptions')
      .upsert({
        uid,
        plan_id: 'pro',
        status: 'active',
        stripe_subscription_id: `founder-pro-${uid}`,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'uid'
      });

    if (subError) throw subError;

    return NextResponse.json({ 
      success: true, 
      message: `User ${email} (${uid}) has been upgraded to PRO.`,
      note: 'This user is a co-founder and should never be deleted.'
    });
  } catch (err: any) {
    console.error('Upgrade founder failed:', err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

