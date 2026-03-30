import { NextResponse } from 'next/server';
import { getPostmarkClient } from '@/lib/postmark';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUid } from '@/lib/authServer';
import { checkReviewRequestQuota } from '@/lib/entitlements';
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

  const quota = await checkReviewRequestQuota(uid, businessId, 1);
  if (!quota.allowed) {
    return new NextResponse(quota.reason || 'Plan limit reached.', { status: 403 });
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
