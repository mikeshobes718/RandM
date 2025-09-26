import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
	const sha = process.env.GIT_SHA || null;
	const deployedAt = process.env.DEPLOYED_AT || null;
	const hasStripeLiveKey = Boolean(process.env.STRIPE_SECRET_KEY);
	const hasPostmark = Boolean(process.env.POSTMARK_SERVER_TOKEN);
	const emailFrom = process.env.EMAIL_FROM || null;
	const appUrl = process.env.APP_URL || null;
	return NextResponse.json({ status:'ok', sha, deployedAt, hasStripeLiveKey, hasPostmark, emailFrom, appUrl });
}
