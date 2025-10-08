import { NextResponse } from 'next/server';
import { getPostmarkClient } from '@/lib/postmark';
import { getEnv } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { message: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Store subscription in database
    const supabase = getSupabaseAdmin();
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email: normalizedEmail,
          subscribed_at: new Date().toISOString(),
          source: 'website',
          status: 'active',
        },
        {
          onConflict: 'email',
          ignoreDuplicates: false,
        }
      );

    if (dbError) {
      console.error('Newsletter subscription DB error:', dbError);
      // Don't fail if database insert fails
    }

    // Send welcome email
    try {
      const env = getEnv();
      const postmark = getPostmarkClient();

      await postmark.sendEmail({
        From: env.EMAIL_FROM,
        To: normalizedEmail,
        Subject: 'Welcome to Reviews & Marketing Newsletter 🌟',
        HtmlBody: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Reviews & Marketing!</h1>
              </div>
              
              <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin-top: 0;">Thanks for subscribing! 🎉</h2>
                <p style="color: #475569; font-size: 16px;">
                  You're now part of a community of 500+ business owners who are mastering the art of collecting 5-star reviews.
                </p>
                
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
                  <h3 style="margin-top: 0; color: #1e293b;">What to expect:</h3>
                  <ul style="color: #475569; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">📊 Monthly growth strategies and review collection tips</li>
                    <li style="margin-bottom: 8px;">🎯 Proven email templates and QR code best practices</li>
                    <li style="margin-bottom: 8px;">🚀 Product updates and new feature announcements</li>
                    <li style="margin-bottom: 8px;">💎 Exclusive offers for subscribers only</li>
                  </ul>
                </div>
                
                <p style="color: #475569;">
                  In the meantime, why not explore what Reviews & Marketing can do for your business?
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://reviewsandmarketing.com/register" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Start Free Trial</a>
                </div>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 14px;">
                <p>You're receiving this because you subscribed to our newsletter at reviewsandmarketing.com</p>
                <p>
                  <a href="https://reviewsandmarketing.com/newsletter/unsubscribe?email=${encodeURIComponent(normalizedEmail)}" style="color: #667eea; text-decoration: none;">Unsubscribe</a> • 
                  <a href="https://reviewsandmarketing.com" style="color: #667eea; text-decoration: none;">Visit Website</a>
                </p>
              </div>
            </body>
          </html>
        `,
        TextBody: `
Welcome to Reviews & Marketing Newsletter!

Thanks for subscribing! You're now part of a community of 500+ business owners who are mastering the art of collecting 5-star reviews.

What to expect:
• Monthly growth strategies and review collection tips
• Proven email templates and QR code best practices
• Product updates and new feature announcements
• Exclusive offers for subscribers only

Ready to get started? Visit https://reviewsandmarketing.com/register to start your free trial.

---
You're receiving this because you subscribed to our newsletter at reviewsandmarketing.com
Unsubscribe: https://reviewsandmarketing.com/newsletter/unsubscribe?email=${encodeURIComponent(normalizedEmail)}
        `.trim(),
        MessageStream: 'outbound',
      });
    } catch (emailError) {
      console.error('Newsletter welcome email error:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { message: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}

