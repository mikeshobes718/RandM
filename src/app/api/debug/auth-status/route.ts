import { NextRequest, NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const idTokenCookie = cookieStore.get('idToken')?.value || '';
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
  
  const debug: any = {
    timestamp: new Date().toISOString(),
    hasCookie: !!idTokenCookie,
    hasAuthHeader: !!bearerToken,
    cookieLength: idTokenCookie.length,
    bearerLength: bearerToken.length,
  };

  try {
    const auth = getAuthAdmin();
    let user: any = null;

    // Try session cookie first
    if (idTokenCookie) {
      try {
        const dec = await auth.verifySessionCookie(idTokenCookie, true);
        user = await auth.getUser(dec.uid);
        debug.authMethod = 'sessionCookie';
        debug.success = true;
      } catch (e: any) {
        debug.sessionCookieError = e.message;
      }
    }

    // Try bearer token
    if (!user && bearerToken) {
      try {
        const dec = await auth.verifyIdToken(bearerToken);
        user = await auth.getUser(dec.uid);
        debug.authMethod = 'bearerToken';
        debug.success = true;
      } catch (e: any) {
        debug.bearerTokenError = e.message;
      }
    }

    // Try cookie as raw idToken
    if (!user && idTokenCookie) {
      try {
        const dec = await auth.verifyIdToken(idTokenCookie);
        user = await auth.getUser(dec.uid);
        debug.authMethod = 'cookieAsIdToken';
        debug.success = true;
      } catch (e: any) {
        debug.cookieAsIdTokenError = e.message;
      }
    }

    if (user) {
      debug.user = {
        uid: user.uid,
        email: user.email || null,
        emailVerified: user.emailVerified,
        displayName: user.displayName || null,
      };
    } else {
      debug.success = false;
      debug.message = 'No valid authentication found';
    }

    return NextResponse.json(debug);
  } catch (e: any) {
    debug.fatalError = e.message;
    debug.success = false;
    return NextResponse.json(debug, { status: 500 });
  }
}

