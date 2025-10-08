import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getEnv } from '@/lib/env';
import { verifyEmailTemplate } from '@/lib/emailTemplates';
import { simpleVerifyEmailTemplate } from '@/lib/emailTemplatesSimple';
import { sendEmailWithFallback } from '@/lib/emailService';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Increase timeout to 30 seconds

/**
 * Server-side user registration
 * Creates user via Firebase Admin SDK (which doesn't send auto-emails)
 * Then sends our branded verification email via multi-provider service
 */
export async function POST(req: Request) {
	try {
		const { email, password, displayName } = await req.json();

		if (!email || !password) {
			return new NextResponse('Email and password are required', { status: 400 });
		}

		if (password.length < 8) {
			return new NextResponse('Password must be at least 8 characters', { status: 400 });
		}

		const { APP_URL } = getEnv();
		const auth = getAuthAdmin();

		// Create user with Firebase Admin SDK (doesn't trigger auto-emails)
		let userRecord;
		try {
			userRecord = await auth.createUser({
				email: email.trim(),
				password,
				displayName: displayName?.trim() || undefined,
				emailVerified: false, // Will be verified via our email
			});
		} catch (error: any) {
			console.error('[REGISTER] Firebase user creation failed:', error);
			
			if (error.code === 'auth/email-already-exists') {
				return new NextResponse('Email already registered', { status: 400 });
			}
			if (error.code === 'auth/invalid-email') {
				return new NextResponse('Invalid email address', { status: 400 });
			}
			if (error.code === 'auth/weak-password') {
				return new NextResponse('Password is too weak', { status: 400 });
			}
			
			return new NextResponse(`Registration failed: ${error.message}`, { status: 500 });
		}

		console.log('[REGISTER] ✅ User created:', userRecord.uid);

		// Generate custom token for immediate login
		const customToken = await auth.createCustomToken(userRecord.uid);
		console.log('[REGISTER] ✅ Custom token generated');

		// Generate verification link
		let verificationLink: string;
		try {
			verificationLink = await auth.generateEmailVerificationLink(email.trim(), {
				url: `${APP_URL}/verify-email`,
			});
			console.log('[REGISTER] ✅ Verification link generated');
		} catch (linkError: any) {
			console.error('[REGISTER] ❌ Failed to generate verification link:', linkError);
			return NextResponse.json({
				success: true,
				customToken,
				uid: userRecord.uid,
				email: userRecord.email,
				emailSendFailed: true,
				errorDetails: 'Failed to generate verification link',
				message: 'Account created but verification email could not be sent. Please request a new verification email.',
			});
		}

		// Prepare email templates (full and simplified fallback)
		const fullTemplate = verifyEmailTemplate(verificationLink, displayName);
		const simpleTemplate = simpleVerifyEmailTemplate(verificationLink, displayName);
		
		console.log('[REGISTER] Sending email to:', email.trim());
		console.log('[REGISTER] Full template HTML length:', fullTemplate.html.length);
		console.log('[REGISTER] Simple template HTML length:', simpleTemplate.html.length);
		
		// Send email with multi-provider support and fallback
		const emailResult = await sendEmailWithFallback(
			{
				to: email.trim(),
				subject: fullTemplate.subject,
				html: fullTemplate.html,
				text: fullTemplate.text,
			},
			simpleTemplate.html // Fallback to simple template if full one fails
		);

		// Log email send to Supabase
		try {
			const supa = getSupabaseAdmin();
			await supa.from('email_log').insert({
				provider: emailResult.provider,
				to_email: email.trim(),
				template: 'verify',
				status: emailResult.success ? 'sent' : 'failed',
				provider_message_id: emailResult.messageId || null,
				payload: {
					subject: fullTemplate.subject,
					uid: userRecord.uid,
					attempts: emailResult.attempts,
					error: emailResult.error,
				},
			});
		} catch (logError) {
			console.error('[REGISTER] Failed to log email send:', logError);
		}

		if (emailResult.success) {
			console.log(`[REGISTER] ✅ Email sent via ${emailResult.provider}, ID: ${emailResult.messageId}`);
			return NextResponse.json({
				success: true,
				customToken,
				uid: userRecord.uid,
				email: userRecord.email,
				emailProvider: emailResult.provider,
				message: 'Account created successfully. Please check your email to verify your address.',
			});
		} else {
			console.error('[REGISTER] ❌ All email providers failed:', emailResult.error);
			return NextResponse.json({
				success: true,
				customToken,
				uid: userRecord.uid,
				email: userRecord.email,
				emailSendFailed: true,
				errorDetails: emailResult.error,
				message: 'Account created but verification email failed to send. Please request a new verification email.',
			});
		}
	} catch (error: any) {
		console.error('[REGISTER] ❌ Registration error:', error);
		return new NextResponse(
			`Registration failed: ${error.message || 'Unknown error'}`,
			{ status: 500 }
		);
	}
}
