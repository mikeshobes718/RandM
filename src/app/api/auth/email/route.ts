import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getEnv } from '@/lib/env';
import { resetEmailTemplate, verifyEmailTemplate } from '@/lib/emailTemplates';
import { simpleResetEmailTemplate, simpleVerifyEmailTemplate } from '@/lib/emailTemplatesSimple';
import { sendEmailWithFallback } from '@/lib/emailService';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Increase timeout to 30 seconds

export async function POST(req: Request) {
	const { email, type } = await req.json();
	const { APP_URL } = getEnv();
	const auth = getAuthAdmin();

	console.log(`[AUTH_EMAIL] Processing ${type} request for:`, email);

	// Try to get user's display name for personalization
	let userName: string | undefined;
	try {
		const userRecord = await auth.getUserByEmail(email);
		userName = userRecord.displayName || undefined;
	} catch {
		// User might not exist yet or email not found, that's okay
		userName = undefined;
	}

	// Generate custom verification/reset links using our domain
	let link: string;
	try {
		if (type === 'verify') {
			// Generate Firebase action code
			const actionCodeSettings = {
				url: `${APP_URL}/verify-email`,
				handleCodeInApp: false
			};
			const actionCode = await auth.generateEmailVerificationLink(email, actionCodeSettings);
			
			// Extract the oobCode from Firebase link and create our custom link
			const url = new URL(actionCode);
			const oobCode = url.searchParams.get('oobCode');
			if (!oobCode) {
				throw new Error('Failed to extract oobCode from Firebase link');
			}
			
			link = `${APP_URL}/api/auth/verify?mode=verifyEmail&oobCode=${oobCode}`;
		} else {
			// Generate Firebase action code for password reset
			const actionCodeSettings = {
				url: `${APP_URL}/login`,
				handleCodeInApp: false
			};
			const actionCode = await auth.generatePasswordResetLink(email, actionCodeSettings);
			
			// Extract the oobCode from Firebase link and create our custom link
			const url = new URL(actionCode);
			const oobCode = url.searchParams.get('oobCode');
			if (!oobCode) {
				throw new Error('Failed to extract oobCode from Firebase link');
			}
			
			link = `${APP_URL}/api/auth/verify?mode=resetPassword&oobCode=${oobCode}`;
		}
		console.log(`[AUTH_EMAIL] ✅ ${type} link generated: ${link}`);
	} catch (e) {
		const msg = `Link generation failed: ${e instanceof Error ? e.message : String(e)}`;
		console.error('[AUTH_EMAIL] ❌', msg);
		return new NextResponse(msg, { status: 400 });
	}

	// Prepare templates (full and simplified fallback)
	const fullTemplate = type === 'verify' 
		? verifyEmailTemplate(link, userName) 
		: resetEmailTemplate(link, userName);
	const simpleTemplate = type === 'verify'
		? simpleVerifyEmailTemplate(link, userName)
		: simpleResetEmailTemplate(link, userName);

	console.log(`[AUTH_EMAIL] Full template HTML length:`, fullTemplate.html.length);
	console.log(`[AUTH_EMAIL] Simple template HTML length:`, simpleTemplate.html.length);

	// Send email with multi-provider support and fallback
	const emailResult = await sendEmailWithFallback(
		{
			to: email,
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
			to_email: email,
			template: type,
			status: emailResult.success ? 'sent' : 'failed',
			provider_message_id: emailResult.messageId || null,
			payload: {
				subject: fullTemplate.subject,
				attempts: emailResult.attempts,
				error: emailResult.error,
			},
		});
	} catch (logError) {
		console.error('[AUTH_EMAIL] Failed to log email send:', logError);
	}

	if (emailResult.success) {
		console.log(`[AUTH_EMAIL] ✅ Email sent via ${emailResult.provider}, ID: ${emailResult.messageId}`);
		return NextResponse.json({
			ok: true,
			id: emailResult.messageId,
			provider: emailResult.provider,
		});
	} else {
		console.error('[AUTH_EMAIL] ❌ All email providers failed:', emailResult.error);
		return new NextResponse(
			`Email send failed: ${emailResult.error}`,
			{ status: 502 }
		);
	}
}
