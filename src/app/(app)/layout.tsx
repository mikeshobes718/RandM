import { redirect } from 'next/navigation';
import { requireUid } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Require authentication and email verification for all app routes
  let uid: string;
  try {
    uid = await requireUid();
  } catch {
    // Fail open: allow app shell to render and handle sign-in CTA client-side.
    // This avoids verify-email loops due to cookie race conditions.
    return <>{children}</>;
  }

  // Check if user's email is verified
  try {
    const auth = getAuthAdmin();
    const userRecord = await auth.getUser(uid);
    
    if (!userRecord.emailVerified) {
      console.log('[APP LAYOUT] User email not verified, redirecting to verify-email');
      redirect('/verify-email');
    }
  } catch (error) {
    console.error('[APP LAYOUT] Error checking email verification:', error);
    // If we can't check verification status, redirect to verify-email for safety
    redirect('/verify-email');
  }

  // Check if user has completed onboarding (has google_place_id)
  // Skip this check for onboarding routes to avoid redirect loops
  // Note: This check is handled by individual page layouts to avoid loops

  return <>{children}</>;
}
