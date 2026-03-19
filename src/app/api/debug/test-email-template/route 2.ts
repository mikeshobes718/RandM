import { NextResponse } from 'next/server';
import { reviewRequestEmail } from '@/lib/emailTemplates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test with a simple body
    const testBody = `Subject: How was your experience at Smart Fit?

Hi there,

Thank you for visiting us recently! We strive to provide the best service possible and would greatly appreciate your feedback.

Could you take 30 seconds to share your experience?

https://reviewsandmarketing.com/r/123

Thank you,
The team at Smart Fit`;

    const { subject, html, text } = reviewRequestEmail(
      'John',
      testBody,
      'Smart Fit',
      'https://reviewsandmarketing.com/r/123'
    );

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
