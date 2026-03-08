import { redirect } from 'next/navigation';
import { requireUid } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { headers } from 'next/headers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	let uid: string;
  try {
    uid = await requireUid();
  } catch {
    // No valid server-side session — let client-side Firebase handle auth.
    return <>{children}</>;
  }

  // Only redirect to verify-email if we POSITIVELY confirm the email is NOT verified.
  // Any error = fail open (let the dashboard render; client-side handles its own auth).
  try {
    const auth = getAuthAdmin();
    const userRecord = await auth.getUser(uid);
    if (userRecord && userRecord.emailVerified === false) {
      redirect('/verify-email');
    }
  } catch {
    // Firebase Admin error (network, rate limit, etc.) — fail open
  }

	const headersList = await headers();
	const isFromEdit = headersList.get('x-from-edit') === 'true';

	if (!isFromEdit) {
		try {
			const supabase = getSupabaseAdmin();
			const { data: business } = await supabase
				.from('businesses')
				.select('google_place_id')
				.eq('owner_uid', uid)
				.single();

			if (business && !business.google_place_id) {
				redirect('/onboarding/business');
			}
			// If query errors or returns null, fail open — don't redirect
		} catch {
			// Supabase error — fail open
		}
	}

	return <>{children}</>;
}
