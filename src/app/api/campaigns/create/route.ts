import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { name, type, body: content } = body;

    if (!name || !type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supa = getSupabaseAdmin();

    // --- ONE-TIME SETUP LOGIC ---
    try {
      await supa.rpc('execute_sql', { sql: `
        CREATE TABLE IF NOT EXISTS campaigns (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          name text NOT NULL,
          type text NOT NULL, -- 'SMS' or 'Email'
          body text NOT NULL,
          status text DEFAULT 'draft', -- 'draft', 'sending', 'completed', 'failed'
          sent_count integer DEFAULT 0,
          click_count integer DEFAULT 0,
          metadata jsonb DEFAULT '{}'::jsonb,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS ix_campaigns_business_id ON campaigns (business_id);
      ` });
    } catch (e) {
      console.warn('[CAMPAIGNS CREATE] RPC execute_sql not available');
    }
    // ----------------------------

    // Get the user's business
    const { data: biz } = await supa
      .from('businesses')
      .select('id')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    // Create the campaign
    const { data: campaign, error } = await supa
      .from('campaigns')
      .insert({
        business_id: biz.id,
        name,
        type,
        body: content,
        status: 'completed', // Mocking completion for now since we don't have a background worker
        sent_count: 0, // In reality, this would count actual sends
        click_count: 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      campaign,
      message: 'Campaign created successfully!' 
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS CREATE API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
