import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildRedirectUri(appUrl: string): string {
  return `${appUrl.replace(/\/$/, '')}/api/integrations/square/oauth/callback`;
}

const AUTH_BASE = 'https://connect.squareup.com/oauth2/authorize';
const AUTH_BASE_SANDBOX = 'https://connect.squareupsandbox.com/oauth2/authorize';

export async function POST(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const env = getEnv();
  const clientId = env.SQUARE_APPLICATION_ID;
  const clientSecret = env.SQUARE_APPLICATION_SECRET;
  if (!clientId || !clientSecret) {
    return new NextResponse('Square OAuth not configured', { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as { businessId?: string; sandbox?: boolean } | null;
  const sandbox = Boolean(body?.sandbox);
  const businessId = (body?.businessId || '').trim();

  const appUrl = env.APP_URL;
  const redirectUri = buildRedirectUri(appUrl);

  const stateValue = crypto.randomUUID();
  const cookiePayload = JSON.stringify({ state: stateValue, businessId, sandbox });

  const authorize = new URL(sandbox ? AUTH_BASE_SANDBOX : AUTH_BASE);
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('scope', 'CUSTOMERS_READ');
  authorize.searchParams.set('session', 'false');
  authorize.searchParams.set('state', stateValue);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('response_type', 'code');

  const res = NextResponse.json({ url: authorize.toString() });
  res.cookies.set('square_oauth_state', cookiePayload, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 5 * 60,
    path: '/',
  });
  return res;
}
