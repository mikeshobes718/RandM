type EmailParts = {
  title: string;
  intro?: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
};

export function brandedHtml({ title, intro, ctaText, ctaUrl, footerNote }: EmailParts): string {
  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 10px 30px rgba(2,6,23,0.05);">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #eef2ff;background:linear-gradient(90deg,#2563eb,#7c3aed);border-radius:16px 16px 0 0;color:#fff;">
                <table width="100%"><tr>
                  <td style="font-weight:700;font-size:18px;">Reviews & Marketing</td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <h1 style="margin:0 0 8px 0;font-size:22px;color:#0f172a;">${escapeHtml(title)}</h1>
                ${intro ? `<p style=\"margin:0 0 16px 0;color:#334155;font-size:14px;line-height:22px;\">${escapeHtml(intro)}</p>` : ''}
                ${ctaText && ctaUrl ? `<div style=\"margin:20px 0;\"><a href=\"${ctaUrl}\" style=\"background:linear-gradient(90deg,#2563eb,#7c3aed);color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600;display:inline-block\">${escapeHtml(ctaText)}</a></div>` : ''}
                ${footerNote ? `<p style=\"margin:16px 0 0 0;color:#64748b;font-size:12px;\">${escapeHtml(footerNote)}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px;border-radius:0 0 16px 16px;">
                <div>© ${new Date().getFullYear()} Reviews & Marketing — All rights reserved.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

export function reviewRequestEmail(customerName: string | undefined, link: string): { subject: string; html: string; text: string } {
  const subject = 'Quick review request';
  const intro = `Hi ${customerName || ''}, please leave a quick Google review. It only takes a minute!`;
  const html = brandedHtml({ title: 'We value your feedback', intro, ctaText: 'Leave a review', ctaUrl: link, footerNote: 'Thanks for helping us grow!' });
  const text = `Hi ${customerName || ''}, please leave a quick Google review: ${link}`;
  return { subject, html, text };
}

export function inviteEmail(inviter: string, link: string): { subject: string; html: string; text: string } {
  const subject = 'You are invited to Reviews & Marketing';
  const intro = `${inviter} invited you to join their workspace.`;
  const html = brandedHtml({ title: 'Join your team on Reviews & Marketing', intro, ctaText: 'Accept invite', ctaUrl: link });
  const text = `${inviter} invited you. Accept: ${link}`;
  return { subject, html, text };
}

export function verifyEmailTemplate(link: string): { subject: string; html: string; text: string } {
  const subject = 'Verify your email';
  const intro = 'Confirm your email to unlock all features.';
  const html = brandedHtml({ title: 'Verify your email', intro, ctaText: 'Verify now', ctaUrl: link });
  const text = `Verify your email: ${link}`;
  return { subject, html, text };
}

export function resetEmailTemplate(link: string): { subject: string; html: string; text: string } {
  const subject = 'Reset your password';
  const intro = 'Click the button below to reset your password securely.';
  const html = brandedHtml({ title: 'Reset your password', intro, ctaText: 'Reset password', ctaUrl: link });
  const text = `Reset your password: ${link}`;
  return { subject, html, text };
}

export function starterWelcomeEmail(appUrl: string): { subject: string; html: string; text: string } {
  const subject = 'Welcome to Reviews & Marketing Starter';
  const intro = 'Your Starter workspace is ready. Connect your business and launch your first review request today.';
  const html = brandedHtml({
    title: 'You’re on the Starter plan',
    intro,
    ctaText: 'Set up your review link',
    ctaUrl: appUrl,
    footerNote: 'Starter includes five review requests each month plus your shared QR code. Upgrade to Pro anytime for more volume and team access.',
  });
  const text = `${intro} Visit your workspace: ${appUrl}`;
  return { subject, html, text };
}

export function proUpgradeEmail(appUrl: string): { subject: string; html: string; text: string } {
  const subject = 'Thanks for upgrading to Pro';
  const intro = 'Your Pro subscription is active. Multi-location routing, advanced analytics, and priority support are unlocked.';
  const html = brandedHtml({
    title: 'Pro plan activated',
    intro,
    ctaText: 'Open the dashboard',
    ctaUrl: appUrl,
    footerNote: 'Need help getting the most from Pro? Reply to this email and our team will walk you through best practices.',
  });
  const text = `${intro} Open the dashboard: ${appUrl}`;
  return { subject, html, text };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
