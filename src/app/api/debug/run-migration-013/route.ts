import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'PG pool not configured' });
  
  const client = await pool.connect();
  try {
    const sql = 'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_photo_url text;';
    await client.query(sql);
    return NextResponse.json({ success: true, message: 'Column added successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  } finally {
    client.release();
  }
}

