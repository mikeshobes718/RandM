import { NextRequest, NextResponse } from 'next/server';
import { sendEmailWithFallback } from '@/lib/emailService';
import { starterWelcomeEmailTemplate, proWelcomeEmailTemplate } from '@/lib/emailTemplates';

export async function POST(request: NextRequest) {
  try {
    const { email, plan } = await request.json();

    if (!email || !plan) {
      return NextResponse.json(
        { error: 'Email and plan are required' },
        { status: 400 }
      );
    }

    if (!['starter', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "starter" or "pro"' },
        { status: 400 }
      );
    }

    // Select the appropriate template based on plan
    const template = plan === 'pro' ? proWelcomeEmailTemplate() : starterWelcomeEmailTemplate();
    
    // Send the welcome email
    const result = await sendEmailWithFallback({
      to: email,
      subject: plan === 'pro' 
        ? 'Welcome to Reviews & Marketing Pro!' 
        : 'Welcome to Reviews & Marketing Starter!',
      html: template,
      text: plan === 'pro' 
        ? 'Welcome to Reviews & Marketing Pro! Your Pro subscription is active. You now have access to all our advanced features including unlimited review requests, advanced analytics, team collaboration tools, priority support, custom email templates, and API access. Visit your dashboard to get started.'
        : 'Welcome to Reviews & Marketing Starter! Your Starter account is ready. You can now start collecting reviews with our free tools including 5 review requests per month, QR code generator, basic analytics dashboard, and email support. Visit your dashboard to get started.',
    });

    console.log(`Welcome email sent to ${email} for ${plan} plan:`, result);

    return NextResponse.json({ 
      success: true, 
      message: `Welcome email sent for ${plan} plan`,
      result 
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
