import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function GET() {
	let envError = null;
	try {
		getEnv();
	} catch (e: any) {
		envError = e.message;
	}
	const sha = process.env.GIT_SHA || null;
	const deployedAt = process.env.DEPLOYED_AT || null;
	const hasStripeLiveKey = Boolean(process.env.STRIPE_SECRET_KEY);
	const hasPostmark = Boolean(process.env.POSTMARK_SERVER_TOKEN);
	const emailFrom = process.env.EMAIL_FROM || null;
	const appUrl = process.env.APP_URL || null;
	return NextResponse.json({ 
		status: envError ? 'error' : 'ok', 
		envError,
		sha, 
		deployedAt, 
		hasStripeLiveKey, 
		hasPostmark, 
		emailFrom, 
		appUrl 
	});
}
