import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserRole, canManageMembers } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId') || '';
  if (!businessId) return new NextResponse('Missing businessId', { status: 400 });

  const role = await getUserRole(uid, businessId);
  if (!role) return new NextResponse('Forbidden', { status: 403 });

  type MemberRow = { uid: string; role: string; added_at: string };
  type InviteRow = { email: string; role: string; invited_at: string; token: string };
  const supa = getSupabaseAdmin();
  let members: { data: MemberRow[] | null } = { data: [] };
  let invites: { data: InviteRow[] | null } = { data: [] };
  try {
    const m = await supa.from('business_members').select('uid,role,added_at').eq('business_id', businessId);
    members = { data: m.data || [] };
    console.log('[LIST API] Members query result:', JSON.stringify(m));
  } catch (e) {
    console.error('[LIST API] Members query error:', e);
  }
  try {
    const i = await supa.from('member_invites').select('email,role,invited_at,token').eq('business_id', businessId);
    invites = { data: i.data || [] };
    console.log('[LIST API] Invites query result:', JSON.stringify(i));
  } catch (e) {
    console.error('[LIST API] Invites query error:', e);
  }
  
  const response = {
    canManage: canManageMembers(role),
    members: members.data || [],
    invites: invites.data || [],
    role,
  };
  console.log('[LIST API] Returning response:', JSON.stringify(response));
  return NextResponse.json(response);
}
