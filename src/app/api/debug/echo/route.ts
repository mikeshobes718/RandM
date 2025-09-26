import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hdrs = await headers();
  const cookieHeader = (await cookies()).get('idToken')?.value ? '[present]' : '[missing]';
  const result = {
    method: 'GET',
    path: url.pathname,
    cookie_idToken: cookieHeader,
    userAgent: hdrs.get('user-agent'),
    xFF: hdrs.get('x-forwarded-for'),
    cfCountry: hdrs.get('cloudfront-viewer-country') || hdrs.get('cf-ipcountry') || hdrs.get('x-vercel-ip-country') || null,
  };
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const hdrs = await headers();
  const ct = hdrs.get('content-type') || '';
  let body: Record<string, unknown> | null = null;
  try { body = await req.clone().json(); } catch {}
  if (!body && (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data'))) {
    const fd = await req.formData();
    body = Object.fromEntries(Array.from(fd.keys()).map(k => [k, fd.get(k)]));
  }
  const result = {
    method: 'POST',
    path: url.pathname,
    contentType: ct,
    cookie_idToken: (await cookies()).get('idToken') ? '[present]' : '[missing]',
    hasAuthHeader: !!hdrs.get('authorization'),
    bodyKeys: body ? Object.keys(body) : [],
  };
  return NextResponse.json(result);
}
