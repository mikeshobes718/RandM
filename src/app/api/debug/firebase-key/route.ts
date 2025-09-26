import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64 || '';
    const decoded = b64 ? Buffer.from(b64, 'base64').toString('utf8') : '';
    let parsed: { private_key?: string } | null = null;
    try { parsed = decoded ? JSON.parse(decoded) : null; } catch {}
    const pk = parsed?.private_key || '';
    const hasBackslashN = /\\n/.test(pk);
    const hasRealNewline = /\n/.test(pk);
    return NextResponse.json({
      length: pk.length,
      hasBackslashN,
      hasRealNewline,
      head: pk.substring(0, 40),
      mid: pk.substring(40, 80),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

