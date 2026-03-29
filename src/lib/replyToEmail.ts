import type { SupabaseClient } from '@supabase/supabase-js';

export function normalizeReplyToInput(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  return t.length ? t : null;
}

/**
 * Reply-To used on outbound customer emails: explicit `reply_to_email` when set, else account email.
 */
export async function getEffectiveReplyTo(
  supa: SupabaseClient,
  uid: string
): Promise<string | undefined> {
  const { data } = await supa.from('users').select('email, reply_to_email').eq('uid', uid).maybeSingle();
  if (!data) return undefined;
  const account = typeof data.email === 'string' ? data.email.trim() : '';
  const override = normalizeReplyToInput(data.reply_to_email as string | null);
  return override || account || undefined;
}

export function effectiveReplyFromUserRow(row: {
  email?: string | null;
  reply_to_email?: string | null;
} | null): string | null {
  if (!row) return null;
  const account = typeof row.email === 'string' ? row.email.trim() : '';
  const override = normalizeReplyToInput(row.reply_to_email);
  return (override || account || null) as string | null;
}
