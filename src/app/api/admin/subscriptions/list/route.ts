import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    const authAdmin = getAuthAdmin();
    let decodedToken;
    try {
      decodedToken = await authAdmin.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.length > 0 && !adminEmails.includes(decodedToken.email?.toLowerCase() || '')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    
    const supa = getSupabaseAdmin();
    let query = supa
      .from('subscriptions')
      .select('uid,plan_id,status,current_period_end,updated_at')
      .order('updated_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query.limit(200);
    if (error) throw error;
    
    return NextResponse.json({ subscriptions: data || [] });
  } catch (error) {
    console.error('Admin subscriptions list API error:', error);
    return new NextResponse(`Error fetching subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

