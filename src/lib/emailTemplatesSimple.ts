/**
 * Simplified email templates as fallback
 * Minimal HTML/CSS for maximum deliverability
 */

export function simpleVerifyEmailTemplate(link: string, userName?: string): { subject: string; html: string; text: string } {
  const subject = 'Verify your email — Reviews & Marketing';
  const greeting = userName ? `Hi ${userName},` : 'Welcome!';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Reviews & Marketing</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">${greeting}</h2>
              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Thanks for joining Reviews & Marketing! Click the button below to verify your email address and unlock your dashboard.
              </p>
              
              <div style="margin: 30px 0;">
                <a href="${link}" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Verify Email</a>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                🔒 This link expires in 24 hours. If you didn't create this account, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f7fafc; text-align: center;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} Reviews & Marketing. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  
  const text = `${greeting}\n\nThanks for joining Reviews & Marketing! Verify your email: ${link}\n\n🔒 This link expires in 24 hours. If you didn't create this account, please ignore this email.`;
  
  return { subject, html, text };
}

export function simpleResetEmailTemplate(link: string, userName?: string): { subject: string; html: string; text: string } {
  const subject = 'Reset your password — Reviews & Marketing';
  const greeting = userName ? `Hi ${userName},` : 'Hello,';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Reviews & Marketing</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">${greeting}</h2>
              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <div style="margin: 30px 0;">
                <a href="${link}" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Reset Password</a>
              </div>
              
              <p style="margin: 20px 0; color: #4a5568; font-size: 14px;">
                Or <a href="https://reviewsandmarketing.com/login" style="color: #667eea;">return to login</a>
              </p>
              
              <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                🔒 This link expires in 1 hour. If you didn't request this, please ignore this email or contact support.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f7fafc; text-align: center;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} Reviews & Marketing. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  
  const text = `${greeting}\n\nWe received a request to reset your password. Reset it here: ${link}\n\nOr return to login: https://reviewsandmarketing.com/login\n\n🔒 This link expires in 1 hour. If you didn't request this, please ignore this email.`;
  
  return { subject, html, text };
}
