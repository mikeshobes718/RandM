import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();
  
  try {
    // Check subscriptions
    const { data: subs, error: subsError } = await supa
      .from('subscriptions')
      .select('*');
    
    console.log('Subscriptions:', subs);
    
    if (!subs || subs.length === 0) {
      return NextResponse.json({
        message: 'No subscriptions found in database',
        count: 0,
        subscriptions: []
      });
    }
    
    // For each subscription, try to find the user
    const results = await Promise.all(subs.map(async (sub) => {
      const { data: user } = await supa
        .from('users')
        .select('uid, email, role')
        .eq('uid', sub.uid)
        .single();
        
      const { data: biz } = await supa
        .from('businesses')
        .select('id, name')
        .eq('owner_uid', sub.uid)
        .single();
      
      return {
        subscription: {
          uid: sub.uid,
          status: sub.status,
          plan_id: sub.plan_id,
          stripe_customer_id: sub.stripe_customer_id
        },
        user: user || null,
        business: biz || null
      };
    }));
    
    return NextResponse.json({
      message: 'Found subscriptions',
      count: subs.length,
      details: results
    });
  } catch (err: any) {
    console.error('Debug error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
