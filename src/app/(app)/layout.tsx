import { redirect } from 'next/navigation';
import { requireUid } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import AppShell from '@/components/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let uid: string;
  try {
    uid = await requireUid();
  } catch {
    return <AppShell>{children}</AppShell>;
  }

  try {
    const auth = getAuthAdmin();
    const userRecord = await auth.getUser(uid);
    
    if (!userRecord.emailVerified) {
      redirect('/verify-email');
    }
  } catch (error) {
    console.error('[APP LAYOUT] Error checking email verification:', error);
    redirect('/verify-email');
  }

  return <AppShell>{children}</AppShell>;
}
