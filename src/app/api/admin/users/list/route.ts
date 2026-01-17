import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || '50');
    const offset = Number(url.searchParams.get('offset') || '0');
    
    const supa = getSupabaseAdmin();
    
    // Get total count
    const { count, error: countError } = await supa
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;
    
    // Get users
    const { data, error } = await supa
      .from('users')
      .select('uid,email,role,rep_id,created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    
    return NextResponse.json({ 
      users: data || [], 
      total: count || 0 
    });
  } catch (error) {
    console.error('Admin users list API error:', error);
    return new NextResponse(`Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

