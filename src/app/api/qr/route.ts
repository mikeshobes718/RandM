import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { requireUid } from '@/lib/authServer';
import { hasActivePro } from '@/lib/entitlements';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get('data') || '';
  const format = (searchParams.get('format') || 'png').toLowerCase();
  const scale = Number(searchParams.get('scale') || 8);
  const margin = Number(searchParams.get('margin') || 1);

  if (!data) return new NextResponse('Missing data', { status: 400 });

  // Starter plan restriction: QR only for the user's saved review link(s)
  const uid = await requireUid().catch(() => null);
  if (uid) {
    const pro = await hasActivePro(uid);
    if (!pro) {
      const supa = getSupabaseAdmin();
      const { data: biz } = await supa.from('businesses').select('id, review_link').eq('owner_uid', uid);
      const allowed = new Set<string>();
      (biz || []).forEach((b: { id: string; review_link: string | null }) => {
        if (b.review_link) {
          allowed.add(b.review_link);
          try {
            const url = new URL(b.review_link);
            allowed.add(`${url.origin}${url.pathname}`);
          } catch {}
        }
        try {
          // Allow landing URL on both APP_URL base and current request origin (apex/www)
          const base = new URL(process.env.APP_URL || '');
          const landingPath = `/r/${b.id}`;
          allowed.add(new URL(landingPath, base).toString());
          
          const reqUrl = new URL(req.url);
          const currentOrigin = `${reqUrl.protocol}//${reqUrl.host}`;
          allowed.add(new URL(landingPath, currentOrigin).toString());
        } catch {}
      });

      // Normalize data for comparison (remove query params for the check)
      let normalizedData = data;
      try {
        const url = new URL(data);
        normalizedData = `${url.origin}${url.pathname}`;
      } catch {}

      if (!allowed.has(data) && !allowed.has(normalizedData)) {
        return new NextResponse('Starter plan allows QR only for your saved review link.', { status: 403 });
      }
    }
  }

  if (format === 'svg') {
    const svg = await QRCode.toString(data, { type: 'svg', margin, scale });
    return new NextResponse(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
  } else {
    const png = await QRCode.toBuffer(data, { type: 'png', margin, scale });
    const uint8 = new Uint8Array(png);
    return new NextResponse(uint8, { headers: { 'Content-Type': 'image/png' } });
  }
}
