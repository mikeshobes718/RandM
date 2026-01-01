import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';
import { getEnv } from '@/lib/env';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

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

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[DEBUG] Email test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

