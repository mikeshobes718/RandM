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
  // Use a simpler, more robust modern container layout
  return `
    <div style="background-color: #f4f7ff; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">R&M</span>
        </div>
        
        <!-- Main Card -->
        <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          ${greeting ? `<div style="color: #64748b; font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">${escapeHtml(greeting)}</div>` : ''}
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 24px; line-height: 1.2;">${escapeHtml(title)}</h1>
          
          <div style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            ${intro ? escapeHtml(intro).replace(/\n/g, '<br/>') : '<em>(No message content)</em>'}
          </div>

          ${ctaText && ctaUrl ? `
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${ctaUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; display: inline-block;">
                ${escapeHtml(ctaText)}
              </a>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
          <p><strong>Reviews & Marketing</strong></p>
          <p>${footerNote ? escapeHtml(footerNote) : ''}</p>
          <div style="margin-top: 10px;">
            <a href="https://reviewsandmarketing.com/privacy" style="color: #94a3b8; margin: 0 5px;">Privacy</a> • 
            <a href="https://reviewsandmarketing.com/terms" style="color: #94a3b8; margin: 0 5px;">Terms</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function reviewRequestEmail(customerName: string | undefined, body: string, businessName?: string, link?: string): { subject: string; html: string; text: string } {
  const subject = businessName ? `Share your experience with ${businessName}` : 'We\'d love your feedback!';
  const greeting = customerName ? `Hi ${customerName},` : 'Hello!';
  
  // Extract content parts to avoid double injection of Subject/Hi there
  // But ensure we never end up with empty content
  let cleanBody = body.trim();
  const originalBody = body.trim();
  
  // Remove "Subject:" line if present
  if (cleanBody.toLowerCase().startsWith('subject:')) {
    const firstNewline = cleanBody.indexOf('\n');
    if (firstNewline !== -1) {
      const afterSubject = cleanBody.substring(firstNewline + 1).trim();
      // Only remove Subject line if there's content after it
      if (afterSubject.length > 0) {
        cleanBody = afterSubject;
      }
    }
  }
  
  // Remove greeting if it matches common patterns (but preserve content)
  const lowerBody = cleanBody.toLowerCase();
  const greetingPatterns = ['hi ', 'hello', 'hey '];
  const hasGreeting = greetingPatterns.some(pattern => lowerBody.startsWith(pattern));
  
  if (hasGreeting) {
    // Find the first meaningful line break (skip empty lines)
    let firstNewline = cleanBody.indexOf('\n');
    if (firstNewline === -1) {
      // No newline, check if entire body is just greeting
      if (cleanBody.length < 50) {
        // Likely just a greeting, use original body
        cleanBody = originalBody;
      }
    } else {
      // Skip multiple newlines/whitespace
      let afterGreeting = cleanBody.substring(firstNewline).trim();
      // If we have substantial content after greeting, use it
      if (afterGreeting.length > 10) {
        cleanBody = afterGreeting;
      } else {
        // Not enough content, keep original
        cleanBody = originalBody;
      }
    }
  }
  
  // Final safety check: if cleanup resulted in empty or minimal content, use original body
  if (!cleanBody || cleanBody.trim().length < 10) {
    cleanBody = originalBody;
  }

  // Ensure we always have content - if still empty, use a default message
  if (!cleanBody || cleanBody.trim().length === 0) {
    cleanBody = 'We would love to hear about your experience. Please share your feedback with us!';
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
