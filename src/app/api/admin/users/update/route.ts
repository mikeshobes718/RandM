import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, role, rep_id } = body;
    
    if (!uid) {
      return new NextResponse('Missing uid', { status: 400 });
    }
    
    const supa = getSupabaseAdmin();
    
    const { error } = await supa
      .from('users')
      .update({ role, rep_id })
      .eq('uid', uid);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user update API error:', error);
    return new NextResponse(`Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}
