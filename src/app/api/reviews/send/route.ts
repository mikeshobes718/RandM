import { NextResponse } from 'next/server';
import { getPostmarkClient } from '@/lib/postmark';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUid } from '@/lib/authServer';
import { hasActivePro } from '@/lib/entitlements';
import { makeGoogleReviewLinkFromWriteUri } from '@/lib/googlePlaces';
import { getEnv } from '@/lib/env';
import { reviewRequestEmail } from '@/lib/emailTemplates';
import { getEffectiveReplyTo } from '@/lib/replyToEmail';

export async function POST(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const { businessId, placeId, toEmail, customerName, reviewLink } = await req.json();
  const postmark = getPostmarkClient();
  const supabaseAdmin = getSupabaseAdmin();
  const { EMAIL_FROM } = getEnv();

  // Verify the business belongs to the user
  const { data: biz } = await supabaseAdmin.from('businesses').select('id,owner_uid').eq('id', businessId).maybeSingle();
  if (!biz || biz.owner_uid !== uid) return new NextResponse('Forbidden', { status: 403 });

  // Starter plan limit: 5 review requests per month per business
  const pro = await hasActivePro(uid);
  if (!pro) {
    const start = new Date();
    start.setUTCDate(1); start.setUTCHours(0,0,0,0);
    const { count } = await supabaseAdmin
      .from('review_requests')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('created_at', start.toISOString());
    if ((count || 0) >= 5) {
      return new NextResponse('Starter limit reached (5 review requests per month). Upgrade to Pro.', { status: 403 });
    }
  }

  const link = reviewLink || makeGoogleReviewLinkFromWriteUri(undefined, placeId);
  const tpl = reviewRequestEmail(customerName, link);
  const replyTo = await getEffectiveReplyTo(supabaseAdmin, uid);
  const result = await postmark.sendEmail({
    From: EMAIL_FROM,
    To: toEmail,
    Subject: tpl.subject,
    HtmlBody: tpl.html,
    TextBody: tpl.text,
    MessageStream: 'outbound',
    ...(replyTo ? { ReplyTo: replyTo } : {}),
  });

  await supabaseAdmin.from('review_requests').insert({
    business_id: businessId,
    google_place_id: placeId,
    review_link: link,
    status: 'sent',
    provider_message_id: (result as unknown as { MessageID: string }).MessageID,
  });

  return NextResponse.json({ ok: true });
}
