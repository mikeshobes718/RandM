import { NextRequest, NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { idToken, days = 7 } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    try {
      const auth = getAuthAdmin();
      
      // Verify the ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Create a session cookie
      const expiresIn = days * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
      
      // Set the session cookie as HttpOnly
      const response = NextResponse.json({ success: true });
      response.cookies.set('idToken', sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn,
        path: '/'
      });
      
      return response;
    } catch (firebaseError) {
      console.error('Firebase Admin SDK error:', firebaseError);
      // If Firebase Admin SDK fails, we can't create session cookies
      // Return success but without session cookie - the client will use the ID token directly
      return NextResponse.json({ success: true, warning: 'Session cookie creation failed, using ID token directly' });
    }
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}