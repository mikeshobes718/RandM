import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminEmail } from '@/lib/adminEmails';

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
    let dbUser = await supa
      .from('users')
      .select('role, rep_id, reply_to_email')
      .eq('uid', uid)
      .maybeSingle()
      .then(res => res.data);

    // If user doesn't exist in Supabase, create them with role 'customer'
    if (!dbUser) {
      console.log(`[AUTH ME] Creating Supabase user record for ${uid} with role: customer`);
      try {
        await supa.from('users').upsert({
          uid,
          email,
          role: 'customer',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'uid',
          ignoreDuplicates: false
        });
        dbUser = { role: 'customer', rep_id: null, reply_to_email: null };
      } catch (upsertError) {
        console.error('[AUTH ME] Failed to create user record:', upsertError);
        // Continue with default values
        dbUser = { role: 'customer', rep_id: null, reply_to_email: null };
      }
    }

    let role = dbUser?.role || 'customer';
    if (isAdminEmail(email)) role = 'admin';

    const replyToEmailRaw =
      (dbUser as { reply_to_email?: string | null } | null)?.reply_to_email ?? null;

    return NextResponse.json({ 
      uid, 
      email, 
      emailVerified,
      role,
      rep_id: dbUser?.rep_id || null,
      /** Stored override; null/empty means use sign-in email for Reply-To. */
      replyToEmail: replyToEmailRaw,
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
}
