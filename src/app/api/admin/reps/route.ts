import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/supabaseAdmin';

export async function GET() {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const { rows } = await pool.query('SELECT * FROM reps ORDER BY created_at DESC');
    return NextResponse.json({ reps: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const pool = getPgPool();
  if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const { name, email, whatsapp, payment_method, payment_id, status, start_date, notes } = await req.json();

    // Generate unique tracking code
    const tracking_code = `rep_${Math.random().toString(36).substring(2, 8)}`;

    const { rows } = await pool.query(
      `INSERT INTO reps (name, email, whatsapp, payment_method, payment_id, status, start_date, tracking_code, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, email, whatsapp, payment_method, payment_id, status || 'trial', start_date || new Date(), tracking_code, notes]
    );

    return NextResponse.json({ rep: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
