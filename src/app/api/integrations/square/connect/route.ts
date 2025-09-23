import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hasActivePro } from '@/lib/entitlements';
import { Client, Environment } from 'square';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createClient(accessToken: string, sandbox: boolean): Client {
  return new Client({
    accessToken,
    environment: sandbox ? Environment.Sandbox : Environment.Production,
  });
}

async function resolveBusinessId(uid: string): Promise<string | null> {
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

export async function GET() {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const pro = await hasActivePro(uid);
  if (!pro) {
    return new NextResponse('Pro plan required', { status: 403 });
  }
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from('square_connections')
    .select('business_id,sandbox,last_backfill_at,default_location_id,merchant_id')
    .eq('uid', uid)
    .maybeSingle();
  if (error) return new NextResponse(error.message, { status: 500 });
  if (!data) return NextResponse.json({ connected: false });
  return NextResponse.json({
    connected: true,
    businessId: data.business_id,
    sandbox: data.sandbox,
    lastBackfillAt: data.last_backfill_at,
    defaultLocationId: data.default_location_id,
    merchantId: data.merchant_id,
  });
}

export async function POST(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const pro = await hasActivePro(uid);
  if (!pro) return new NextResponse('Pro plan required', { status: 403 });
  const body = await req.json().catch(() => ({}));
  const rawToken = String(body?.accessToken || '').trim();
  if (!rawToken) return new NextResponse('Missing accessToken', { status: 400 });
  const sandbox = Boolean(body?.sandbox);
  let businessId = String(body?.businessId || '').trim();
  if (!businessId) {
    businessId = await resolveBusinessId(uid) || '';
  }
  if (!businessId) {
    return new NextResponse('No business found for this account', { status: 400 });
  }
  const client = createClient(rawToken, sandbox);
  let defaultLocationId = String(body?.defaultLocationId || '').trim() || null;
  let merchantId: string | null = null;
  try {
    const response = await client.locationsApi.listLocations();
    const locations = response.result?.locations ?? [];
    if (!defaultLocationId && locations.length) {
      defaultLocationId = locations[0]?.id ?? null;
    }
    merchantId = locations.find((loc) => loc?.merchantId)?.merchantId ?? locations[0]?.merchantId ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to validate Square token';
    return new NextResponse(message, { status: 400 });
  }

  const supa = getSupabaseAdmin();
  const { error } = await supa.from('square_connections').upsert({
    uid,
    business_id: businessId,
    access_token: rawToken,
    refresh_token: null,
    expires_at: null,
    merchant_id: merchantId,
    default_location_id: defaultLocationId,
    sandbox,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'uid' });
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json({
    connected: true,
    merchantId,
    defaultLocationId,
    sandbox,
  });
}

export async function DELETE() {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const pro = await hasActivePro(uid);
  if (!pro) return new NextResponse('Pro plan required', { status: 403 });
  const supa = getSupabaseAdmin();
  const { error } = await supa.from('square_connections').delete().eq('uid', uid);
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
