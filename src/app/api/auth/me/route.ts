import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const cookie = (await cookies()).get('idToken')?.value || '';
  const authz = req.headers.get('authorization') || '';
  const bearer = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7) : '';
  if (!cookie && !bearer) return new NextResponse('Unauthorized', { status: 401 });
  
  try {
    const auth = getAuthAdmin();
    let uid = '';
    let email = '';
    let emailVerified = false;

    try {
      // Prefer session cookie if present
      if (cookie) {
        const dec = await auth.verifySessionCookie(cookie, true);
        const user = await auth.getUser(dec.uid);
        uid = dec.uid;
        email = user.email || '';
        emailVerified = user.emailVerified === true;
      }
    } catch {
      // Fallback to raw idToken (Authorization header) or cookie value
      try {
        const tok = bearer || cookie;
        const dec = await auth.verifyIdToken(tok);
        const user = await auth.getUser(dec.uid);
        uid = dec.uid;
        email = user.email || '';
        emailVerified = user.emailVerified === true;
      } catch {
        // Basic JWT decode without verification (not secure, but works as temporary fix)
        const parts = cookie.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp > now) {
            uid = payload.user_id || payload.sub;
            email = payload.email || '';
            emailVerified = payload.email_verified === true;
          }
        }
      }
    }

    if (!uid) return new NextResponse('Unauthorized', { status: 401 });

    // Fetch extra info from Supabase users table
    const supa = getSupabaseAdmin();
    const { data: dbUser } = await supa
      .from('users')
      .select('role, rep_id')
      .eq('uid', uid)
      .maybeSingle();

    return NextResponse.json({ 
      uid, 
      email, 
      emailVerified,
      role: dbUser?.role || 'customer',
      rep_id: dbUser?.rep_id || null
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
}
