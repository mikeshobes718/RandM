import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getPostmarkClient } from '@/lib/postmark';
import { getEnv } from '@/lib/env';
import { accountDeletionRequestEmail, accountDeletionNotificationToSupport } from '@/lib/emailTemplates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const uid = await requireUid();
    if (!uid) return new NextResponse('Unauthorized', { status: 401 });

    // Parse request body for optional reason
    const body = await req.json().catch(() => ({}));
    const reason = body.reason;

    // Get user info
    const auth = getAuthAdmin();
    const user = await auth.getUser(uid);
    const email = user.email;
    const displayName = user.displayName || undefined;

    if (!email) {
      return NextResponse.json({ error: 'No email found for user' }, { status: 400 });
    }

    const env = getEnv();
    const postmark = getPostmarkClient();

    // Generate branded emails using templates
    const userEmail = accountDeletionRequestEmail(email, displayName, reason);
    const supportEmail = accountDeletionNotificationToSupport(email, displayName, reason, uid);

    // Send to support email
    await postmark.sendEmail({
      From: env.EMAIL_FROM,
      To: 'support@reviewsandmarketing.com',
      Subject: supportEmail.subject,
      TextBody: supportEmail.text,
      HtmlBody: supportEmail.html,
      MessageStream: 'outbound',
    });

    // Send confirmation email to user
    await postmark.sendEmail({
      From: env.EMAIL_FROM,
      To: email,
      Subject: userEmail.subject,
      TextBody: userEmail.text,
      HtmlBody: userEmail.html,
      MessageStream: 'outbound',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Deletion request sent. Check your email for confirmation.' 
    });
  } catch (error) {
    console.error('Account deletion request error:', error);
    return NextResponse.json(
      { error: 'Failed to process deletion request' },
      { status: 500 }
    );
  }
}
