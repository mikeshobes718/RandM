import { cookies } from 'next/headers';
import { getAuthAdmin } from './firebaseAdmin';

export type VerifiedIdToken = { uid: string; email?: string | null };

export async function verifyIdTokenViaRest(token: string): Promise<VerifiedIdToken> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
  if (!apiKey) throw new Error('unauthenticated');
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}` , {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
      // Vercel/Node: reasonable timeout
    });
    if (!r.ok) throw new Error('unauthenticated');
    const j = (await r.json()) as { users?: { localId?: string; email?: string }[] };
    const user = j?.users?.[0];
    if (!user?.localId) throw new Error('unauthenticated');
    return { uid: user.localId, email: user.email ?? null };
  } catch {
    throw new Error('unauthenticated');
  }
}

const AUTH_COOKIE = 'idToken';

export async function requireUid(): Promise<string> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) throw new Error('unauthenticated');
  try {
    const auth = getAuthAdmin();
    try {
      const decoded = await auth.verifySessionCookie(token, true);
      return decoded.uid as string;
    } catch {
      const decoded = await auth.verifyIdToken(token);
      return decoded.uid as string;
    }
  } catch {
    // As a safety net in environments without Admin SDK configured, try REST verification
    return (await verifyIdTokenViaRest(token)).uid;
  }
}







