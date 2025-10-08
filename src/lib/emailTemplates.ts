type EmailParts = {
  title: string;
  greeting?: string;
  intro?: string;
  benefits?: string[];
  ctaText?: string;
  ctaUrl?: string;
  secondaryCta?: { text: string; url: string };
  securityNote?: string;
  footerNote?: string;
};

// Plan-specific welcome email templates
export function starterWelcomeEmailTemplate(): string {
  return brandedHtml({
    title: 'Welcome to Reviews & Marketing Starter!',
    greeting: 'Welcome to Reviews & Marketing!',
    intro: 'Your Starter account is ready. You can now start collecting reviews with our free tools.',
    benefits: [
      '5 review requests per month',
      'QR code generator for your business',
      'Basic analytics dashboard',
      'Email support included'
    ],
    ctaText: 'Connect Your Business',
    ctaUrl: `${process.env.APP_URL}/onboarding/business?plan=starter`,
    secondaryCta: {
      text: 'View Pricing',
      url: `${process.env.APP_URL}/pricing`
    },
    securityNote: 'This email was sent to you because you created an account with Reviews & Marketing.',
    footerNote: 'Need help? Reply to this email or visit our support center.'
  });
}

export function proWelcomeEmailTemplate(): string {
  return brandedHtml({
    title: 'Welcome to Reviews & Marketing Pro!',
    greeting: 'Welcome to Reviews & Marketing Pro!',
    intro: 'Your Pro subscription is active. You now have access to all our advanced features.',
    benefits: [
      'Unlimited review requests',
      'Advanced analytics & reporting',
      'Team collaboration tools',
      'Priority support',
      'Custom email templates',
      'API access'
    ],
    ctaText: 'Connect Your Business',
    ctaUrl: `${process.env.APP_URL}/onboarding/business?plan=pro`,
    secondaryCta: {
      text: 'View Dashboard',
      url: `${process.env.APP_URL}/dashboard`
    },
    securityNote: 'This email was sent to you because you subscribed to Reviews & Marketing Pro.',
    footerNote: 'Need help? Reply to this email or visit our support center.'
  });
}

export function brandedHtml({ title, greeting, intro, benefits, ctaText, ctaUrl, secondaryCta, securityNote, footerNote }: EmailParts): string {
  // Dark mode safe colors
  const benefitsList = benefits && benefits.length > 0 ? benefits.map(b => 
    `<li style="margin:6px 0;color:#475569;font-size:14px;line-height:20px;">✓ ${escapeHtml(b)}</li>`
  ).join('') : '';
  
  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${escapeHtml(title)}</title>
    <style>
      @media (prefers-color-scheme: dark) {
        .dark-mode-bg { background-color: #1e293b !important; }
        .dark-mode-text { color: #e2e8f0 !important; }
        .dark-mode-border { border-color: #334155 !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <!-- Main card -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 10px 30px rgba(2,6,23,0.06);">
            <!-- Header with gradient and logo -->
            <tr>
              <td style="padding:32px 40px;border-bottom:1px solid #eef2ff;background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);border-radius:16px 16px 0 0;">
                <table width="100%"><tr>
                  <td>
                    <div style="font-weight:800;font-size:20px;color:#ffffff;letter-spacing:-0.02em;">⚡ Reviews & Marketing</div>
                    <div style="font-size:13px;color:#e0e7ff;margin-top:4px;font-weight:500;">Reputation Toolkit</div>
                  </td>
                </tr></table>
              </td>
            </tr>
            <!-- Body content -->
            <tr>
              <td style="padding:36px 40px;">
                ${greeting ? `<p style="margin:0 0 20px 0;color:#0f172a;font-size:16px;font-weight:600;">${escapeHtml(greeting)}</p>` : ''}
                <h1 style="margin:0 0 16px 0;font-size:24px;color:#0f172a;font-weight:700;line-height:1.3;">${escapeHtml(title)}</h1>
                ${intro ? `<p style="margin:0 0 20px 0;color:#334155;font-size:15px;line-height:24px;">${escapeHtml(intro)}</p>` : ''}
                ${benefitsList ? `<ul style="margin:16px 0;padding-left:0;list-style:none;">${benefitsList}</ul>` : ''}
                ${ctaText && ctaUrl ? `
                <div style=\"margin:28px 0;\">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="25%" stroke="f" fillcolor="#4f46e5">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">${escapeHtml(ctaText)}</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <a href="${ctaUrl}" style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 4px 12px rgba(79,70,229,0.3);transition:transform 0.2s,box-shadow 0.2s;" target="_blank">${escapeHtml(ctaText)}</a>
                  <!--<![endif]-->
                </div>` : ''}
                ${secondaryCta ? `<div style=\"margin:12px 0;\"><a href=\"${secondaryCta.url}\" style=\"color:#6366f1;text-decoration:none;font-size:14px;font-weight:600;\" target=\"_blank\">${escapeHtml(secondaryCta.text)} →</a></div>` : ''}
                ${securityNote ? `<p style=\"margin:24px 0 0 0;padding:12px;background:#f1f5f9;border-left:3px solid #64748b;color:#475569;font-size:13px;line-height:20px;border-radius:4px;\">${escapeHtml(securityNote)}</p>` : ''}
                ${footerNote ? `<p style=\"margin:20px 0 0 0;color:#64748b;font-size:13px;line-height:20px;\">${escapeHtml(footerNote)}</p>` : ''}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:24px 40px;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;background:#fafafa;">
                <table width="100%">
                  <tr>
                    <td style="color:#64748b;font-size:12px;line-height:18px;">
                      <div style="margin-bottom:12px;">
                        <strong style="color:#0f172a;font-size:13px;">Reviews & Marketing</strong><br/>
                        Need help? <a href="mailto:support@reviewsandmarketing.com" style="color:#6366f1;text-decoration:none;">support@reviewsandmarketing.com</a>
                      </div>
                      <div style="margin:8px 0;">
                        <a href="https://reviewsandmarketing.com/privacy" style="color:#64748b;text-decoration:none;margin-right:12px;">Privacy</a>
                        <a href="https://reviewsandmarketing.com/terms" style="color:#64748b;text-decoration:none;margin-right:12px;">Terms</a>
                        <a href="https://reviewsandmarketing.com/support" style="color:#64748b;text-decoration:none;">Support</a>
                      </div>
                      <div style="margin-top:12px;color:#94a3b8;font-size:11px;">
                        © ${new Date().getFullYear()} Reviews & Marketing. All rights reserved.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <!-- Spacer for mobile -->
          <div style="height:16px;"></div>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

export function reviewRequestEmail(customerName: string | undefined, link: string, businessName?: string): { subject: string; html: string; text: string } {
  const subject = businessName ? `Share your experience with ${businessName}` : 'We\'d love your feedback!';
  const greeting = customerName ? `Hi ${customerName},` : 'Hello!';
  const intro = businessName 
    ? `Thank you for choosing ${businessName}! We hope you had a great experience. Would you mind taking a moment to share your feedback?`
    : 'Thank you for your business! We hope you had a great experience and would love to hear about it.';
  const html = brandedHtml({ 
    title: 'We value your feedback', 
    greeting,
    intro, 
    ctaText: 'Leave a Review', 
    ctaUrl: link, 
    footerNote: 'Your review helps us improve and helps others make informed decisions. Thank you!' 
  });
  const text = `${greeting}\n\n${intro}\n\nLeave a review: ${link}\n\nThank you!`;
  return { subject, html, text };
}

export function inviteEmail(inviter: string, link: string, recipientName?: string): { subject: string; html: string; text: string } {
  const subject = `${inviter} invited you to Reviews & Marketing`;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hello!';
  const intro = `${inviter} has invited you to join their team workspace on Reviews & Marketing. Accept the invitation to start collaborating on review collection and reputation management.`;
  const benefits = [
    'Collaborate on review campaigns',
    'Monitor customer feedback together',
    'Share QR codes and review links',
    'Track team performance',
  ];
  const html = brandedHtml({ 
    title: 'Join your team on Reviews & Marketing', 
    greeting,
    intro, 
    benefits,
    ctaText: 'Accept Invitation', 
    ctaUrl: link,
    footerNote: 'This invitation was sent to you by a team member. If you believe this was sent in error, you can safely ignore this email.'
  });
  const text = `${greeting}\n\n${intro}\n\nAccept invitation: ${link}\n\nWhat you'll get:\n• Collaborate on campaigns\n• Monitor feedback\n• Share resources\n• Track performance`;
  return { subject, html, text };
}

export function verifyEmailTemplate(link: string, userName?: string): { subject: string; html: string; text: string } {
  const subject = 'Verify your email — Welcome to Reviews & Marketing!';
  const greeting = userName ? `Hi ${userName},` : 'Welcome!';
  const intro = 'Thanks for joining Reviews & Marketing! Confirm your email address to unlock your review dashboard and start collecting 5-star reviews.';
  const benefits = [
    'Send unlimited review requests',
    'Monitor feedback in real-time',
    'Generate branded QR codes',
    'Invite team members to collaborate',
  ];
  const securityNote = '🔒 If you didn\'t create this account, please ignore this email. This link will expire in 24 hours for your security.';
  
  const html = brandedHtml({ 
    title: 'Verify your email address', 
    greeting,
    intro, 
    benefits,
    ctaText: 'Confirm Email', 
    ctaUrl: link,
    securityNote,
    footerNote: 'Need help getting started? Reply to this email or visit our support center.'
  });
  const text = `${greeting}\n\n${intro}\n\nVerify your email: ${link}\n\n${securityNote}`;
  return { subject, html, text };
}

export function resetEmailTemplate(link: string, userName?: string): { subject: string; html: string; text: string } {
  const subject = 'Reset your password — Reviews & Marketing';
  const greeting = userName ? `Hi ${userName},` : 'Hello,';
  const intro = 'We received a request to reset your password. Click the button below to create a new password and regain access to your account.';
  const securityNote = '🔒 If you didn\'t request this password reset, please ignore this email or contact our support team immediately. This link will expire in 1 hour.';
  
  const html = brandedHtml({ 
    title: 'Reset your password', 
    greeting,
    intro, 
    ctaText: 'Reset Password', 
    ctaUrl: link,
    secondaryCta: { text: 'Return to Login', url: 'https://reviewsandmarketing.com/login' },
    securityNote,
    footerNote: 'For security reasons, we never send passwords via email. If you continue having trouble, contact support@reviewsandmarketing.com.'
  });
  const text = `${greeting}\n\n${intro}\n\nReset your password: ${link}\n\n${securityNote}\n\nOr return to login: https://reviewsandmarketing.com/login`;
  return { subject, html, text };
}

export function starterWelcomeEmail(appUrl: string, userName?: string): { subject: string; html: string; text: string } {
  const subject = '🎉 Welcome to Reviews & Marketing!';
  const greeting = userName ? `Hi ${userName},` : 'Welcome!';
  const intro = 'Your Starter workspace is ready! You\'re all set to start collecting reviews and building your online reputation.';
  const benefits = [
    '5 review requests each month',
    'Branded QR code generator',
    'Real-time feedback monitoring',
    'Google, Yelp & Facebook support',
  ];
  const html = brandedHtml({
    title: 'Your Starter plan is active',
    greeting,
    intro,
    benefits,
    ctaText: 'Set Up Your Review Link',
    ctaUrl: appUrl,
    footerNote: 'Ready for more? Upgrade to Pro anytime for unlimited requests, team access, and advanced analytics.',
  });
  const text = `${greeting}\n\n${intro}\n\nWhat's included:\n• 5 review requests/month\n• Branded QR codes\n• Real-time monitoring\n• Multi-platform support\n\nGet started: ${appUrl}`;
  return { subject, html, text };
}

export function proUpgradeEmail(appUrl: string, userName?: string): { subject: string; html: string; text: string } {
  const subject = '🚀 Welcome to Pro — Your upgrade is live!';
  const greeting = userName ? `Hi ${userName},` : 'Hello!';
  const intro = 'Your Pro subscription is now active! You\'ve unlocked the full power of Reviews & Marketing.';
  const benefits = [
    'Unlimited review requests',
    'Multi-location support',
    'Advanced analytics & reporting',
    'Team collaboration tools',
    'Priority support',
  ];
  const html = brandedHtml({
    title: 'Pro plan activated',
    greeting,
    intro,
    benefits,
    ctaText: 'Open Your Dashboard',
    ctaUrl: appUrl,
    footerNote: 'Need help maximizing your Pro features? Reply to this email and our team will guide you through best practices.',
  });
  const text = `${greeting}\n\n${intro}\n\nYour Pro features:\n• Unlimited requests\n• Multi-location support\n• Advanced analytics\n• Team tools\n• Priority support\n\nOpen dashboard: ${appUrl}`;
  return { subject, html, text };
}

export function accountDeletionRequestEmail(userEmail: string, userName?: string, reason?: string): { subject: string; html: string; text: string } {
  const subject = '⚠️ Account deletion request received';
  const greeting = userName ? `Hi ${userName},` : 'Hello,';
  const intro = 'We received your request to permanently delete your Reviews & Marketing account. Our support team will review your request and process it within 2-3 business days.';
  const securityNote = '🔒 This is an irreversible action. All your data, including review requests, analytics, and team information, will be permanently deleted. If you submitted this request by mistake, please reply to this email immediately.';
  
  const html = brandedHtml({
    title: 'Account deletion request received',
    greeting,
    intro,
    securityNote,
    footerNote: 'Our team will follow up shortly to confirm the deletion. If you have any questions or concerns, reply to this email or contact support@reviewsandmarketing.com.',
  });
  const text = `${greeting}\n\n${intro}\n\n${securityNote}\n\nOur team will follow up within 2-3 business days.`;
  return { subject, html, text };
}

export function accountDeletionNotificationToSupport(userEmail: string, userName?: string, reason?: string, userId?: string): { subject: string; html: string; text: string } {
  const subject = `[ACTION REQUIRED] Account deletion request: ${userEmail}`;
  const intro = `A user has requested account deletion. Please review and process this request within 2-3 business days.`;
  const details = [
    `Email: ${userEmail}`,
    userName ? `Name: ${userName}` : 'Name: Not provided',
    userId ? `User ID: ${userId}` : 'User ID: Not available',
    reason ? `Reason: ${reason}` : 'Reason: Not provided',
  ];
  
  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
            <tr>
              <td>
                <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin-bottom:24px;border-radius:4px;">
                  <h2 style="margin:0 0 8px 0;font-size:18px;color:#dc2626;font-weight:700;">⚠️ Account Deletion Request</h2>
                  <p style="margin:0;color:#991b1b;font-size:14px;">${escapeHtml(intro)}</p>
                </div>
                <h3 style="margin:0 0 12px 0;font-size:16px;color:#0f172a;font-weight:600;">User Details:</h3>
                <ul style="margin:0 0 24px 0;padding-left:20px;color:#475569;font-size:14px;line-height:24px;">
                  ${details.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
                </ul>
                <div style="padding:16px;background:#f1f5f9;border-radius:8px;margin-bottom:24px;">
                  <h4 style="margin:0 0 8px 0;font-size:14px;color:#0f172a;font-weight:600;">Action Required:</h4>
                  <ol style="margin:0;padding-left:20px;color:#475569;font-size:13px;line-height:22px;">
                    <li>Verify the user's identity and account status</li>
                    <li>Cancel any active subscriptions (Stripe)</li>
                    <li>Backup user data if required for legal/compliance</li>
                    <li>Delete all user records from Supabase</li>
                    <li>Delete Firebase Auth account</li>
                    <li>Send confirmation email to user</li>
                  </ol>
                </div>
                <p style="margin:0;color:#64748b;font-size:12px;line-height:18px;">
                  <strong>Timeline:</strong> Complete within 2-3 business days per GDPR/privacy requirements.<br/>
                  <strong>Note:</strong> Ensure all data deletion is logged for compliance.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
  
  const text = `${subject}\n\n${intro}\n\nUser Details:\n${details.join('\n')}\n\nAction Required:\n1. Verify identity\n2. Cancel subscriptions\n3. Backup data if needed\n4. Delete from Supabase\n5. Delete from Firebase\n6. Send confirmation\n\nTimeline: 2-3 business days`;
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
