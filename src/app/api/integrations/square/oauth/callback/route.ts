import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireUid } from '@/lib/authServer';
import { getEnv } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { Client, Environment } from 'square';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN_BASE = 'https://connect.squareup.com/oauth2/token';
const TOKEN_BASE_SANDBOX = 'https://connect.squareupsandbox.com/oauth2/token';

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  merchant_id?: string;
};

async function resolveBusinessId(uid: string, fallback?: string | null): Promise<string | null> {
  if (fallback) return fallback;
  const supa = getSupabaseAdmin();
  const { data } = await supa
    .from('businesses')
    .select('id')
    .eq('owner_uid', uid)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function fetchDefaultLocation(accessToken: string, sandbox: boolean): Promise<{ locationId: string | null; merchantId: string | null }> {
  const client = new Client({
    accessToken,
    environment: sandbox ? Environment.Sandbox : Environment.Production,
  });
  try {
    const response = await client.locationsApi.listLocations();
    const locations = response.result?.locations ?? [];
    const first = locations[0];
    return {
      locationId: first?.id ?? null,
      merchantId: first?.merchantId ?? null,
    };
  } catch {
    return { locationId: null, merchantId: null };
  }
}

export async function GET(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return NextResponse.redirect(new URL('/integrations/square?error=unauthorized', req.url));

  const env = getEnv();
  const clientId = env.SQUARE_APPLICATION_ID;
  const clientSecret = env.SQUARE_APPLICATION_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/integrations/square?error=missing_config', req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    return NextResponse.redirect(new URL('/integrations/square?error=invalid_callback', req.url));
  }

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get('square_oauth_state');
  if (!stateCookie) {
    return NextResponse.redirect(new URL('/integrations/square?error=state_missing', req.url));
  }

  let parsed: { state: string; businessId?: string | null; sandbox?: boolean } | null = null;
  try {
    parsed = JSON.parse(stateCookie.value);
  } catch {
    parsed = null;
  }

  if (!parsed || parsed.state !== state) {
    const res = NextResponse.redirect(new URL('/integrations/square?error=state_mismatch', req.url));
    res.cookies.set('square_oauth_state', '', { maxAge: 0, path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
    return res;
  }

  const sandbox = Boolean(parsed?.sandbox);

  const tokenEndpoint = sandbox ? TOKEN_BASE_SANDBOX : TOKEN_BASE;
  const redirectUri = `${env.APP_URL.replace(/\/$/, '')}/api/integrations/square/oauth/callback`;

  let tokenResponse: TokenResponse | null = null;
  try {
    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      const redirect = NextResponse.redirect(new URL(`/integrations/square?error=${encodeURIComponent(text || 'token_error')}`, req.url));
      redirect.cookies.set('square_oauth_state', '', { maxAge: 0, path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
      return redirect;
    }
    tokenResponse = await res.json() as TokenResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'token_request_failed';
    const redirect = NextResponse.redirect(new URL(`/integrations/square?error=${encodeURIComponent(message)}`, req.url));
    redirect.cookies.set('square_oauth_state', '', { maxAge: 0, path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
    return redirect;
  }

  if (!tokenResponse?.access_token) {
    const redirect = NextResponse.redirect(new URL('/integrations/square?error=no_access_token', req.url));
    redirect.cookies.set('square_oauth_state', '', { maxAge: 0, path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
    return redirect;
  }

  const businessId = await resolveBusinessId(uid, parsed?.businessId || null);
  if (!businessId) {
    const redirect = NextResponse.redirect(new URL('/integrations/square?error=no_business', req.url));
    redirect.cookies.set('square_oauth_state', '', { maxAge: 0, path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
    return redirect;
  }

  const { locationId, merchantId } = await fetchDefaultLocation(tokenResponse.access_token, sandbox);

  const supa = getSupabaseAdmin();
  const { error } = await supa.from('square_connections').upsert({
    uid,
    business_id: businessId,
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token || null,
    expires_at: tokenResponse.expires_at || null,
    merchant_id: merchantId || tokenResponse.merchant_id || null,
    default_location_id: locationId,
    sandbox,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'uid' });
  if (error) {
    const redirect = NextResponse.redirect(new URL(`/integrations/square?error=${encodeURIComponent(error.message)}`, req.url));
    redirect.cookies.set('square_oauth_state', '', { maxAge: 0, path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
    return redirect;
  }

  const redirect = NextResponse.redirect(new URL('/integrations/square?connected=1', req.url));
  redirect.cookies.set('square_oauth_state', '', { maxAge: 0, path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
  return redirect;
}
