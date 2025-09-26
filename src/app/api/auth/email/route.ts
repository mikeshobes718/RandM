import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getPostmarkClient } from '@/lib/postmark';
import { getEnv } from '@/lib/env';
import { resetEmailTemplate, verifyEmailTemplate } from '@/lib/emailTemplates';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
	const { email, type } = await req.json();
	const { EMAIL_FROM, APP_URL } = getEnv();
	const auth = getAuthAdmin();
	const postmark = getPostmarkClient();

	let link: string;
	try {
		link =
			type === 'verify'
				? await auth.generateEmailVerificationLink(email, { url: `${APP_URL}/verify-email` })
				: await auth.generatePasswordResetLink(email, { url: `${APP_URL}/login` });
	} catch (e) {
		const msg = `Link generation failed: ${e instanceof Error ? e.message : String(e)}`;
		console.error(msg);
		return new NextResponse(msg, { status: 400 });
	}

	const tpl = type === 'verify' ? verifyEmailTemplate(link) : resetEmailTemplate(link);
	try {
		const r = await postmark.sendEmail({ From: EMAIL_FROM, To: email, Subject: tpl.subject, HtmlBody: tpl.html, TextBody: tpl.text, MessageStream: 'outbound' });
		const messageId = (r as unknown as { MessageID?: string }).MessageID || null;
		try {
			const supa = getSupabaseAdmin();
			await supa.from('email_log').insert({ provider: 'postmark', to_email: email, template: type, status: 'sent', provider_message_id: messageId, payload: { subject: tpl.subject } });
		} catch {}
		return NextResponse.json({ ok: true, id: messageId });
	} catch (e) {
		const errorText = `Email send failed: ${e instanceof Error ? e.message : String(e)}`;
		console.error('postmark send failed', e);
		try {
			const supa = getSupabaseAdmin();
			await supa.from('email_log').insert({ provider: 'postmark', to_email: email, template: type, status: 'failed', payload: { error: errorText } });
		} catch {}
		return new NextResponse(errorText, { status: 502 });
	}
}
