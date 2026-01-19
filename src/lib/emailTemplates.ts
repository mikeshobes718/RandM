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
    `<li style="margin:8px 0;color:#475569;font-size:14px;line-height:22px;">✓ ${escapeHtml(b)}</li>`
  ).join('') : '';
  
  return `<!doctype html>
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${escapeHtml(title)}</title>
    <style type="text/css">
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; }
      img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
      table { border-collapse: collapse !important; }
      body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
      a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
      @media screen and (max-width: 600px) {
        .mobile-padding { padding: 20px !important; }
        .mobile-br { display: block !important; height: 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f7ff;font-family:'SF Pro Display','SF Pro Text',-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="display: none; max-height: 0px; overflow: hidden;">
      ${escapeHtml(intro || title)}
    </div>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="background-color: #f4f7ff; padding: 40px 10px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
            <!-- Header -->
            <tr>
              <td align="center" style="padding: 0 0 30px 0;">
                <a href="https://reviewsandmarketing.com" target="_blank" style="text-decoration: none;">
                  <span style="font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">R&M</span>
                </a>
              </td>
            </tr>
            <!-- Card -->
            <tr>
              <td style="background-color: #ffffff; padding: 48px; border-radius: 32px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0;" class="mobile-padding">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  ${greeting ? `
                  <tr>
                    <td style="padding: 0 0 16px 0; color: #64748b; font-size: 14px; font-weight: 700; text-transform: uppercase; tracking: 0.1em;">
                      ${escapeHtml(greeting)}
                    </td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding: 0 0 24px 0; color: #0f172a; font-size: 28px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em;">
                      ${escapeHtml(title)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 0 32px 0; color: #334155; font-size: 16px; line-height: 1.6; font-weight: 500;">
                      ${intro ? intro.replace(/\n/g, '<br/>') : ''}
                    </td>
                  </tr>
                  ${benefitsList ? `
                  <tr>
                    <td style="padding: 0 0 32px 0;">
                      <ul style="margin: 0; padding: 0; list-style: none;">
                        ${benefitsList}
                      </ul>
                    </td>
                  </tr>` : ''}
                  ${ctaText && ctaUrl ? `
                  <tr>
                    <td align="center" style="padding: 8px 0 32px 0;">
                      <a href="${ctaUrl}" target="_blank" style="background-color: #4f46e5; border-radius: 16px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: 800; line-height: 60px; text-align: center; text-decoration: none; width: 100%; max-width: 280px; -webkit-text-size-adjust: none; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);">
                        ${escapeHtml(ctaText)}
                      </a>
                    </td>
                  </tr>` : ''}
                  ${secondaryCta ? `
                  <tr>
                    <td align="center" style="padding: 0 0 24px 0;">
                      <a href="${secondaryCta.url}" target="_blank" style="color: #6366f1; font-size: 14px; font-weight: 700; text-decoration: none;">
                        ${escapeHtml(secondaryCta.text)} →
                      </a>
                    </td>
                  </tr>` : ''}
                  ${securityNote ? `
                  <tr>
                    <td style="padding: 24px; background-color: #f8fafc; border-radius: 16px; color: #64748b; font-size: 13px; line-height: 1.5; border: 1px solid #f1f5f9;">
                      ${escapeHtml(securityNote)}
                    </td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 40px 20px 0 20px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="color: #94a3b8; font-size: 12px; line-height: 1.5; font-weight: 500;">
                      ${footerNote ? `<div style="margin-bottom: 20px;">${escapeHtml(footerNote)}</div>` : ''}
                      <div style="font-weight: 700; color: #64748b; margin-bottom: 12px;">Reviews & Marketing</div>
                      <div>
                        <a href="https://reviewsandmarketing.com/privacy" style="color: #94a3b8; text-decoration: underline; margin: 0 8px;">Privacy</a>
                        <a href="https://reviewsandmarketing.com/terms" style="color: #94a3b8; text-decoration: underline; margin: 0 8px;">Terms</a>
                        <a href="https://reviewsandmarketing.com/support" style="color: #94a3b8; text-decoration: underline; margin: 0 8px;">Support</a>
                      </div>
                      <div style="margin-top: 20px; opacity: 0.6;">
                        © ${new Date().getFullYear()} Reviews & Marketing. All rights reserved.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

export function reviewRequestEmail(customerName: string | undefined, body: string, businessName?: string, link?: string): { subject: string; html: string; text: string } {
  const subject = businessName ? `Share your experience with ${businessName}` : 'We\'d love your feedback!';
  const greeting = customerName ? `Hi ${customerName},` : 'Hello!';
  
  // Extract content parts to avoid double injection of Subject/Hi there
  let cleanBody = body;
  if (cleanBody.toLowerCase().startsWith('subject:')) {
    cleanBody = cleanBody.substring(cleanBody.indexOf('\n') + 1).trim();
  }
  if (cleanBody.toLowerCase().startsWith('hi ') || cleanBody.toLowerCase().startsWith('hello')) {
    cleanBody = cleanBody.substring(cleanBody.indexOf('\n') + 1).trim();
  }

  const html = brandedHtml({ 
    title: businessName ? `Experience at ${businessName}` : 'We value your feedback', 
    greeting,
    intro: cleanBody, 
    ctaText: 'Leave a Review', 
    ctaUrl: link || 'https://reviewsandmarketing.com',
    footerNote: 'Your review helps us improve and helps others make informed decisions. Thank you!' 
  });
  
  const text = `${greeting}\n\n${cleanBody}\n\nLeave a review: ${link}\n\nThank you!`;
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
