import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const authAdmin = getAuthAdmin();
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const supa = getSupabaseAdmin();

    // --- ONE-TIME SETUP LOGIC ---
    try {
      await supa.rpc('execute_sql', { sql: `
        CREATE TABLE IF NOT EXISTS contacts (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          name text,
          email text,
          phone text,
          source text DEFAULT 'manual',
          metadata jsonb DEFAULT '{}'::jsonb,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS ix_contacts_business_id ON contacts (business_id);
        CREATE INDEX IF NOT EXISTS ix_contacts_email ON contacts (email);
        CREATE INDEX IF NOT EXISTS ix_contacts_phone ON contacts (phone);
      ` });
    } catch (e) {
      console.warn('[CONTACTS LIST] RPC execute_sql not available');
    }
    // ----------------------------

    // Get the user's business
    const { data: biz } = await supa
      .from('businesses')
      .select('id')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ contacts: [] });
    }

    // Fetch contacts for this business
    const { data: contacts, error } = await supa
      .from('contacts')
      .select('*')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      // Table might not exist yet
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        return NextResponse.json({ contacts: [] });
      }
      throw error;
    }

    return NextResponse.json({ contacts: contacts || [] });
  } catch (error: any) {
    console.error('[CONTACTS LIST API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
