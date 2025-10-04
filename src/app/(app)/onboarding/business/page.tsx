import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function getUidAndEmailFromCookies(): Promise<{ uid: string | null; email: string | null }> {
  try {
    const c = await cookies();
    const token = c.get('idToken')?.value || '';
    if (!token) return { uid: null, email: null };
    const auth = getAuthAdmin();
    try {
      const decoded = await auth.verifySessionCookie(token, true);
      const u = await auth.getUser(decoded.uid as string);
      return { uid: decoded.uid as string, email: u.email || null };
      } catch {}
    try {
      const decoded = await auth.verifyIdToken(token);
      const u = await auth.getUser(decoded.uid as string);
      return { uid: decoded.uid as string, email: u.email || null };
    } catch {}
    return { uid: null, email: null };
  } catch {
    return { uid: null, email: null };
  }
}

async function ensureNoExistingBusinessOrRedirect(uid: string) {
  const supa = getSupabaseAdmin();
  const { data } = await supa
    .from('businesses')
    .select('id')
    .eq('owner_uid', uid)
    .limit(1);
  if (Array.isArray(data) && data[0]?.id) {
    redirect('/dashboard');
  }
}

async function serverSaveBusiness(formData: FormData) {
  'use server';
  const name = String(formData.get('name') || '').trim();
  const reviewLink = String(formData.get('review_link') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;

  const { uid, email } = await getUidAndEmailFromCookies();
  if (!uid || !name) {
    redirect('/login?next=/onboarding/business');
  }

  const supa = getSupabaseAdmin();

  // Best-effort ensure users row exists to satisfy FK
  try {
    await supa.from('users').upsert({ uid, email: email || `${uid}@user.local` });
  } catch {}

  const now = new Date().toISOString();
  await supa
    .from('businesses')
    .upsert({ owner_uid: uid, name, review_link: reviewLink, address, updated_at: now }, { onConflict: 'owner_uid' });

  try {
    const c = await cookies();
    const host = (() => { try { return new URL(process.env.APP_URL || 'https://reviewsandmarketing.com').hostname; } catch { return ''; } })();
    const domain = host.includes('.') ? `.${host.replace(/^www\./,'')}` : undefined;
    c.set('onboarding_complete', '1', { path: '/', maxAge: 60*60*24*365, sameSite: 'lax', domain });
  } catch {}

  redirect('/dashboard');
}

export default async function OnboardingBusinessPage() {
  const { uid } = await getUidAndEmailFromCookies();
  if (!uid) {
    redirect('/login?next=/onboarding/business');
  }
  await ensureNoExistingBusinessOrRedirect(uid!);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white via-indigo-50 to-white py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Connect your business</h1>
          <p className="mt-2 text-gray-600">Enter your business name and optional Google review link. You can refine details later in settings.</p>
        </div>

        <form action={serverSaveBusiness} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl ring-1 ring-black/5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-800">Business name</label>
            <input name="name" required placeholder="Acme Bakery" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800">Google review link (optional)</label>
            <input name="review_link" placeholder="https://search.google.com/local/writereview?..." className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
            <label className="block text-sm font-medium text-gray-800">Address (optional)</label>
            <input name="address" placeholder="123 Main St" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div className="pt-2">
            <button type="submit" className="w-full rounded-xl bg-gray-900 text-white py-3 font-semibold shadow-md hover:bg-gray-800">Save and continue</button>
              </div>
        </form>
      </div>
    </main>
  );
}
