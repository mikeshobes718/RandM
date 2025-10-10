import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserRole, canManageMembers } from '@/lib/roles';
import { getPostmarkClient } from '@/lib/postmark';
import { inviteEmail } from '@/lib/emailTemplates';
import { getEnv } from '@/lib/env';

const Body = z.object({ businessId: z.string(), email: z.string().email(), role: z.enum(['admin','member','viewer']) });

export async function POST(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const { businessId, email, role } = Body.parse(await req.json());
  const myRole = await getUserRole(uid, businessId);
  if (!canManageMembers(myRole)) return new NextResponse('Forbidden', { status: 403 });

  const supa = getSupabaseAdmin();
  const token = crypto.randomUUID();
  await supa.from('member_invites').insert({ token, business_id: businessId, email, role, invited_by: uid });

  const { APP_URL, EMAIL_FROM } = getEnv();
  const pm = getPostmarkClient();
  const link = `${APP_URL}/settings?accept=${token}`;
  const tpl = inviteEmail(uid, link);
  try {
    await pm.sendEmail({ From: EMAIL_FROM, To: email, Subject: tpl.subject, HtmlBody: tpl.html, TextBody: tpl.text });
    return NextResponse.json({ ok: true, emailSent: true });
  } catch (err) {
    // Non-fatal: invitation record exists; surface success so UI can update pending list
    return NextResponse.json({ ok: true, emailSent: false, warning: 'Invite created, but email not sent yet. We\'ll retry shortly.' });
  }
}
