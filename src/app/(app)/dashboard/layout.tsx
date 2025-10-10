import { redirect } from 'next/navigation';
import { requireUid } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { headers } from 'next/headers';

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

	// Check if user has completed onboarding (has google_place_id)
	// Skip this check if coming from edit mode
	const headersList = await headers();
	const isFromEdit = headersList.get('x-from-edit') === 'true';
	const url = headersList.get('x-url') || '';
	
	console.log('[DASHBOARD LAYOUT] Debug info:', {
		isFromEdit,
		url,
		xFromEdit: headersList.get('x-from-edit'),
		xUrl: headersList.get('x-url')
	});
	
	if (!isFromEdit) {
		try {
			const supabase = getSupabaseAdmin();
			const { data: business, error } = await supabase
				.from('businesses')
				.select('google_place_id')
				.eq('owner_uid', uid)
				.single();
			
			if (error) {
				console.error('[DASHBOARD LAYOUT] Error fetching business:', error);
			} else if (!business?.google_place_id) {
				console.log('[DASHBOARD LAYOUT] User has not completed onboarding, redirecting to onboarding');
				redirect('/onboarding/business');
			}
		} catch (error) {
			console.error('[DASHBOARD LAYOUT] Error checking onboarding status:', error);
			// If we can't check onboarding status, redirect to onboarding for safety
			redirect('/onboarding/business');
		}
	}

	return <>{children}</>;
}
