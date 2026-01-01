import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const email = 'mikeybobby718@godfare.com';
  const supa = getSupabaseAdmin();
  const auth = getAuthAdmin();

  try {
    const userRecord = await auth.getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      return NextResponse.json({ success: true, message: 'User not found' });
    }

    const uid = userRecord.uid;
    const tables = ['review_events', 'subscriptions', 'businesses', 'users'];
    for (const table of tables) {
      await supa.from(table).delete().eq('uid', uid);
    }
    await auth.deleteUser(uid);

    return NextResponse.json({ success: true, message: `Deleted ${email}` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

