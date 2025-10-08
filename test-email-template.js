// Quick test to verify email templates are generating correctly
const fs = require('fs');

// Simulate the template functions
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function brandedHtml({ title, greeting, intro, benefits, ctaText, ctaUrl, secondaryCta, securityNote, footerNote }) {
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
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;">
            <tr>
              <td style="padding:32px 40px;background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);border-radius:16px 16px 0 0;">
                <div style="font-weight:800;font-size:20px;color:#ffffff;">⚡ Reviews & Marketing</div>
                <div style="font-size:13px;color:#e0e7ff;margin-top:4px;">Reputation Toolkit</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px;">
                ${greeting ? `<p style="margin:0 0 20px 0;color:#0f172a;font-size:16px;font-weight:600;">${escapeHtml(greeting)}</p>` : ''}
                <h1 style="margin:0 0 16px 0;font-size:24px;color:#0f172a;">${escapeHtml(title)}</h1>
                ${intro ? `<p style="margin:0 0 20px 0;color:#334155;font-size:15px;">${escapeHtml(intro)}</p>` : ''}
                ${benefitsList ? `<ul style="margin:16px 0;padding-left:0;list-style:none;">${benefitsList}</ul>` : ''}
                ${ctaText && ctaUrl ? `<div style="margin:28px 0;"><a href="${ctaUrl}" style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;display:inline-block;" target="_blank">${escapeHtml(ctaText)}</a></div>` : ''}
                ${secondaryCta ? `<div style="margin:12px 0;"><a href="${secondaryCta.url}" style="color:#6366f1;text-decoration:none;font-size:14px;font-weight:600;" target="_blank">${escapeHtml(secondaryCta.text)} →</a></div>` : ''}
                ${securityNote ? `<p style="margin:24px 0 0 0;padding:12px;background:#f1f5f9;border-left:3px solid #64748b;color:#475569;font-size:13px;">${escapeHtml(securityNote)}</p>` : ''}
                ${footerNote ? `<p style="margin:20px 0 0 0;color:#64748b;font-size:13px;">${escapeHtml(footerNote)}</p>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

function verifyEmailTemplate(link, userName) {
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
  
  return { subject, html };
}

// Generate test email
const testLink = 'https://reviewsandmarketing.com/verify-email?mode=verifyEmail&oobCode=TEST123';
const { subject, html } = verifyEmailTemplate(testLink, 'Test User');

console.log('=== EMAIL SUBJECT ===');
console.log(subject);
console.log('\n=== CHECKING HTML CONTENT ===');
console.log('Has benefits list:', html.includes('✓ Send unlimited review requests'));
console.log('Has security note:', html.includes('🔒 If you didn'));
console.log('Has greeting:', html.includes('Hi Test User,'));
console.log('Has CTA button:', html.includes('Confirm Email'));
console.log('\nIf all checks are TRUE, the template is correct!');

// Save to file for visual inspection
fs.writeFileSync('/tmp/test-email.html', html);
console.log('\n✅ Test email saved to /tmp/test-email.html');
console.log('Open it in a browser to verify visually.');

