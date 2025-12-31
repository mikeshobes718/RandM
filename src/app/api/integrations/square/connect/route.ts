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
  
  // First try with all columns, fall back if any don't exist
  let data: any = null;
  let error: any = null;
  
  const result = await supa
    .from('square_connections')
    .select('business_id,sandbox,last_backfill_at,default_location_id,merchant_id,is_enabled,location_name, businesses(name)')
    .eq('uid', uid)
    .maybeSingle();
  
  if (result.error?.message?.includes('is_enabled') || result.error?.message?.includes('location_name')) {
    // Column(s) don't exist yet, query without them
    const fallback = await supa
      .from('square_connections')
      .select('business_id,sandbox,last_backfill_at,default_location_id,merchant_id, businesses(name)')
      .eq('uid', uid)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  } else {
    data = result.data;
    error = result.error;
  }
  
  if (error) return new NextResponse(error.message, { status: 500 });
  if (!data) return NextResponse.json({ connected: false });
  
  const businessName = Array.isArray(data.businesses) ? data.businesses[0]?.name : (data.businesses as any)?.name;

  return NextResponse.json({
    connected: true,
    businessId: data.business_id,
    businessName: businessName || null,
    sandbox: data.sandbox,
    isEnabled: data.is_enabled ?? true,
    locationName: data.location_name || null,
    lastBackfillAt: data.last_backfill_at,
    defaultLocationId: data.default_location_id,
    merchantId: data.merchant_id,
  });
}

export async function PATCH(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const pro = await hasActivePro(uid);
  if (!pro) return new NextResponse('Pro plan required', { status: 403 });

  const body = await req.json().catch(() => ({}));
  const isEnabled = body?.isEnabled;

  if (typeof isEnabled !== 'boolean') {
    return new NextResponse('Missing isEnabled boolean', { status: 400 });
  }

  const supa = getSupabaseAdmin();
  const { error } = await supa
    .from('square_connections')
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq('uid', uid);

  // If the column doesn't exist, just return success (feature not available yet)
  if (error?.message?.includes('is_enabled')) {
    return NextResponse.json({ ok: true, note: 'Feature pending database migration' });
  }
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
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
