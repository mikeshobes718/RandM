import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserRole, canManageMembers } from '@/lib/roles';

const Body = z.object({ token: z.string() });

export async function POST(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const { token } = Body.parse(await req.json());
  
  const supa = getSupabaseAdmin();
  
  // Find the invite to get the business ID
  const { data: invite, error: fetchError } = await supa
    .from('member_invites')
    .select('business_id')
    .eq('token', token)
    .single();
    
  if (fetchError || !invite) return new NextResponse('Invite not found', { status: 404 });
  
  // Check permissions
  const myRole = await getUserRole(uid, invite.business_id);
  if (!canManageMembers(myRole)) return new NextResponse('Forbidden', { status: 403 });
  
  // Delete the invite
  const { error: deleteError } = await supa
    .from('member_invites')
    .delete()
    .eq('token', token);
    
  if (deleteError) return new NextResponse('Failed to cancel invite', { status: 500 });
  
  return NextResponse.json({ ok: true });
}





