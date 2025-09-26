import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Gather chunked envs
    const chunks: { name: string; len: number }[] = [];
    let combined = '';
    for (let i = 1; i <= 20; i++) {
      const k = `FIREBASE_B64_${i}`;
      const v = process.env[k] || '';
      if (!v) break;
      chunks.push({ name: k, len: v.length });
      combined += v;
    }
    const single = process.env.FIREBASE_SERVICE_ACCOUNT_B64 || '';
    const usingChunks = combined.length > 0;
    const usingSingle = !usingChunks && single.length > 0;
    const aggregated = usingChunks ? combined : single;

    let decodedOk = false;
    let projectId = '';
    let clientEmail = '';
    let error: string | undefined;
    if (aggregated) {
      try {
        const json = Buffer.from(aggregated, 'base64').toString('utf8');
        const data = JSON.parse(json) as { project_id?: string; client_email?: string };
        decodedOk = true;
        projectId = (data.project_id || '').slice(0, 12);
        clientEmail = (data.client_email || '').replace(/^[^@]*/,'***');
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json({
      chunks,
      b64SingleLen: single.length,
      aggregatedLen: aggregated.length,
      usingChunks,
      usingSingle,
      decodedOk,
      projectId,
      clientEmail,
      error: error || null,
    });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : 'debug failed', { status: 500 });
  }
}


