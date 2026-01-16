import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
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

    const body = await req.json();
    const { uid, role, rep_id } = body;
    
    if (!uid) {
      return new NextResponse('Missing uid', { status: 400 });
    }
    
    const supa = getSupabaseAdmin();
    
    const { error } = await supa
      .from('users')
      .update({ role, rep_id })
      .eq('uid', uid);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user update API error:', error);
    return new NextResponse(`Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}
