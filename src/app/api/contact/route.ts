import { NextRequest, NextResponse } from "next/server";
import { sendEmailWithFallback } from '@/lib/emailService';
import { getEnv } from '@/lib/env';
import { brandedHtml } from '@/lib/emailTemplates';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, recaptchaToken } = await req.json().catch(() => ({}));
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    // Verify reCAPTCHA v3 if configured
    const secret = process.env.RECAPTCHA_SECRET_KEY || '';
    if (secret && recaptchaToken) {
      const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST', headers: { 'Content-Type':'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: recaptchaToken })
      });
      const result = await resp.json().catch(()=>({ success:false }));
      if (!result.success) return NextResponse.json({ error: 'reCAPTCHA failed' }, { status: 400 });
    }

    const { EMAIL_FROM } = getEnv();
    const support = 'support@reviewsandmarketing.com';
    const subject = `Contact form — ${name}`;
    const sanitizedMessage = message.replace(/</g, '&lt;');
    const html = brandedHtml({
      title: 'New contact form submission',
      intro: `${name} (${email}) wrote:`,
      footerNote: 'We will get back to you as soon as possible.',
    }).replace(
      '</h1>',
      `</h1><div style="margin:12px 0;padding:12px;border-radius:12px;background:#f8fafc;border:1px solid #e5e7eb;color:#0f172a;white-space:pre-wrap;">${sanitizedMessage}</div>`,
    );
    const text = `${name} (${email})\n\n${message}`;

    const supportResult = await sendEmailWithFallback(
      {
        to: support,
        subject,
        html,
        text,
        from: `Reviews & Marketing Contact <${EMAIL_FROM}>`,
      },
    );

    if (!supportResult.success) {
      return NextResponse.json(
        { error: 'Unable to send message. Please try again later or email support@reviewsandmarketing.com directly.' },
        { status: 502 },
      );
    }

    await sendEmailWithFallback(
      {
        to: email,
        subject: 'We received your message',
        html: brandedHtml({
          title: 'Thanks for contacting us',
          intro: 'Our team has received your message and will reply shortly.',
          footerNote: 'If this was not you, please ignore this email.',
        }),
        text: 'We received your message and will reply shortly.',
        from: `Reviews & Marketing <${EMAIL_FROM}>`,
      },
    );

    return NextResponse.json({ ok: true, message: 'Message sent' });
  } catch (e) {
    console.error('[CONTACT] Failed to process submission', e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

















