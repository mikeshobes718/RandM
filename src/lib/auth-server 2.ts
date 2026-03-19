import { cookies } from 'next/headers';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export interface AuthUser {
    uid: string;
    email: string | null;
    emailVerified: boolean;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const cookieStore = await cookies();
        const cookie = cookieStore.get('idToken')?.value;

        if (!cookie) return null;

        const auth = getAuthAdmin();

        // Try verifying as a session cookie first (preferred)
        try {
            const decoded = await auth.verifySessionCookie(cookie, true);
            const user = await auth.getUser(decoded.uid);
            return {
                uid: decoded.uid,
                email: user.email || null,
                emailVerified: user.emailVerified,
            };
        } catch {
            // Fallback to verifying as an ID token
            try {
                const decoded = await auth.verifyIdToken(cookie);
                const user = await auth.getUser(decoded.uid);
                return {
                    uid: decoded.uid,
                    email: user.email || null,
                    emailVerified: user.emailVerified,
                };
            } catch {
                return null;
            }
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}
