import { redirect } from 'next/navigation';
import { requireUid } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	// Require authentication
	let uid: string;
  try {
    uid = await requireUid();
  } catch {
    // Fail open: allow dashboard shell to render and handle sign-in CTA client-side.
    // This avoids verify-email loops due to cookie race conditions.
    return <>{children}</>;
  }

  // Check if user's email is verified
  try {
    const auth = getAuthAdmin();
    const userRecord = await auth.getUser(uid);
    
    if (!userRecord.emailVerified) {
      console.log('[DASHBOARD LAYOUT] User email not verified, redirecting to verify-email');
      redirect('/verify-email');
    }
  } catch (error) {
    console.error('[DASHBOARD LAYOUT] Error checking email verification:', error);
    // If we can't check verification status, redirect to verify-email for safety
    redirect('/verify-email');
  }

	// Do not redirect based on onboarding/business state; let the page render either
	// the connect form or the business view. We keep auth-only gate here.
	return <>{children}</>;
}
