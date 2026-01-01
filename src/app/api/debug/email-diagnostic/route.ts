import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return new NextResponse('Email parameter required', { status: 400 });
  }

  try {
    console.log('[DEBUG] Testing email send to:', email);
    const result = await sendEmail({
      to: email,
      subject: 'Email Diagnostic Test',
      html: '<p>This is a diagnostic test of the email service.</p>',
      text: 'This is a diagnostic test of the email service.',
    });

    return NextResponse.json({
      ...result,
      note: 'This diagnostic route is temporary and should be deleted after use.'
    });
  } catch (error: any) {
    console.error('[DEBUG] Email test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

