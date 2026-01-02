import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa.from('businesses').select('*').limit(1);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const columns = data && data.length > 0 ? Object.keys(data[0]) : 'no data to check columns';
  
  return NextResponse.json({ columns });
}

