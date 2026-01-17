import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    // Try to get token from Authorization header OR session cookie
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
    const sessionCookie = (await cookies()).get('idToken')?.value;
    
    const token = bearerToken || sessionCookie;
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const authAdmin = getAuthAdmin();
    let decodedToken;
    try {
      // Try to verify as session cookie first, then as ID token
      try {
        decodedToken = await authAdmin.verifySessionCookie(token, true);
      } catch {
        decodedToken = await authAdmin.verifyIdToken(token);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.length > 0 && !adminEmails.includes(decodedToken.email?.toLowerCase() || '')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || '50');
    const offset = Number(url.searchParams.get('offset') || '0');
    
    const supa = getSupabaseAdmin();
    
    // Get total count
    const { count, error: countError } = await supa
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;
    
    // Get users
    const { data, error } = await supa
      .from('users')
      .select('uid,email,role,rep_id,created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    
    return NextResponse.json({ 
      users: data || [], 
      total: count || 0 
    });
  } catch (error) {
    console.error('Admin users list API error:', error);
    return new NextResponse(`Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

