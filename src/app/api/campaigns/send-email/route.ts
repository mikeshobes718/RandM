import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/emailService';
import { directOutreachEmail } from '@/lib/emailTemplates';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const authAdmin = getAuthAdmin();
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const supa = getSupabaseAdmin();

    const { data: biz } = await supa
      .from('businesses')
      .select('id, name, review_link')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    const body = await req.json();
    const { recipients, subject, message } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients provided' }, { status: 400 });
    }

    if (!message || !subject) {
      return NextResponse.json({ error: 'Subject and message content are required' }, { status: 400 });
    }

    let sentCount = 0;
    let failedCount = 0;
    let lastError: string | null = null;

    const campaignLink = biz.review_link || `https://reviewsandmarketing.com/r/${biz.id}?source=direct-outreach`;

    const { html, text } = directOutreachEmail(subject, message, biz.name, campaignLink);

    for (const email of recipients) {
      try {
        const result = await sendEmail({
          to: email,
          subject,
          html,
          text,
        });

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          lastError = result.error || 'Email delivery failed';
        }
      } catch (e: any) {
        console.error(`[send-email] Failed for ${email}:`, e.message);
        failedCount++;
        lastError = e.message;
      }
    }

    // Record campaign
    await supa.from('campaigns').insert({
      business_id: biz.id,
      name: `Direct Email Outreach: ${subject} (${sentCount} sent)`,
      type: 'Email',
      body: message,
      status: 'completed',
      sent_count: sentCount,
      click_count: 0,
      metadata: { failed_count: failedCount, last_error: lastError },
    });

    if (sentCount === 0 && failedCount > 0) {
      return NextResponse.json({ error: `Failed to send emails. ${lastError || 'Check email addresses.'}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, sent: sentCount, failed: failedCount });
  } catch (err: any) {
    console.error('[send-email] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
