import { NextResponse } from 'next/server';
import { ServerClient } from 'postmark';
import { Resend } from 'resend';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { email } = await req.json();
  
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const env = getEnv();
  const results: any = {};

  // Test Postmark
  try {
    const postmark = new ServerClient(env.POSTMARK_SERVER_TOKEN);
    const result = await postmark.sendEmail({
      From: env.EMAIL_FROM,
      To: email,
      Subject: 'Test Email from Reviews & Marketing',
      HtmlBody: '<h1>Test Email</h1><p>This is a test email to verify email sending works.</p>',
      TextBody: 'Test Email\n\nThis is a test email to verify email sending works.',
      MessageStream: 'outbound',
    });

    results.postmark = {
      success: true,
      messageId: (result as any).MessageID,
    };
  } catch (error: any) {
    results.postmark = {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  // Test Resend
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Test Email from Reviews & Marketing',
      html: '<h1>Test Email</h1><p>This is a test email to verify email sending works.</p>',
      text: 'Test Email\n\nThis is a test email to verify email sending works.',
    });

    if (result.data) {
      results.resend = {
        success: true,
        messageId: result.data.id,
      };
    } else if (result.error) {
      results.resend = {
        success: false,
        error: result.error.message,
      };
    }
  } catch (error: any) {
    results.resend = {
      success: false,
      error: error.message,
    };
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString(),
  });
}
