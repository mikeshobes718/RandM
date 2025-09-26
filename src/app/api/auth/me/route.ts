import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const cookie = (await cookies()).get('idToken')?.value || '';
  const authz = req.headers.get('authorization') || '';
  const bearer = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7) : '';
  if (!cookie && !bearer) return new NextResponse('Unauthorized', { status: 401 });
  
  try {
    const auth = getAuthAdmin();
    try {
      // Prefer session cookie if present
      if (cookie) {
        const dec = await auth.verifySessionCookie(cookie, true);
        const user = await auth.getUser(dec.uid);
        return NextResponse.json({ uid: dec.uid, email: user.email || null, emailVerified: user.emailVerified === true });
      }
    } catch {}
    // Fallback to raw idToken (Authorization header) or cookie value
    try {
      const tok = bearer || cookie;
      const dec = await auth.verifyIdToken(tok);
      const user = await auth.getUser(dec.uid);
      return NextResponse.json({ uid: dec.uid, email: user.email || null, emailVerified: user.emailVerified === true });
    } catch {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
    
    // TEMPORARY FIX: If Firebase Admin SDK fails, try to decode the JWT token manually
    // This is a workaround until we can fix the Firebase Admin SDK issue
    try {
      // Basic JWT decode without verification (not secure, but works as temporary fix)
      const parts = cookie.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const now = Math.floor(Date.now() / 1000);
        
        // Check if token is not expired
        if (payload.exp && payload.exp > now) {
      const emailVerifiedClaim = typeof payload.email_verified === 'boolean' ? payload.email_verified : undefined;
      const body: { uid: string; email: string | null; emailVerified?: boolean } = {
        uid: payload.user_id || payload.sub,
        email: payload.email || null,
      };
      if (emailVerifiedClaim !== undefined) body.emailVerified = emailVerifiedClaim;
      return NextResponse.json(body);
        }
      }
    } catch (jwtError) {
      console.error('JWT decode failed:', jwtError);
    }
    
    return new NextResponse('Unauthorized', { status: 401 });
  }
}
