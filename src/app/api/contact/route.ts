import { NextRequest, NextResponse } from "next/server";
import { getPostmarkClient } from '@/lib/postmark';
import { getEnv } from '@/lib/env';
import { brandedHtml } from '@/lib/emailTemplates';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, recaptchaToken } = await req.json();
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
    const pm = getPostmarkClient();
    const support = 'support@reviewsandmarketing.com';
    const subject = `Contact form — ${name}`;
    const html = brandedHtml({ title: 'New contact form submission', intro: `${name} (${email}) wrote:`, footerNote: 'We will get back to you as soon as possible.' })
      .replace('</h1>', '</h1>' + `<div style="margin:12px 0;padding:12px;border-radius:12px;background:#f8fafc;border:1px solid #e5e7eb;color:#0f172a;white-space:pre-wrap;">${message.replace(/</g,'&lt;')}</div>`);

    await pm.sendEmail({ From: EMAIL_FROM, To: support, Subject: subject, HtmlBody: html, TextBody: `${name} (${email})\n\n${message}` });
    // Send a copy to the submitter
    await pm.sendEmail({ From: EMAIL_FROM, To: email, Subject: 'We received your message', HtmlBody: brandedHtml({ title: 'Thanks for contacting us', intro: 'Our team has received your message and will reply shortly.' }), TextBody: 'We received your message and will reply shortly.' });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}


















