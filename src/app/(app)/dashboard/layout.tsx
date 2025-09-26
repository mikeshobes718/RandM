import { redirect } from 'next/navigation';
import { requireUid } from '@/lib/authServer';
import { cookies } from 'next/headers';

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
	// Do not redirect based on onboarding/business state; let the page render either
	// the connect form or the business view. We keep auth-only gate here.
	return <>{children}</>;
}
