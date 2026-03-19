import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supa = getSupabaseAdmin();
    
    console.log('[DB-INIT] Starting emergency table creation...');
    
    const { error } = await supa.rpc('execute_sql', { sql: `
      -- 1. Create Contacts Table
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

      -- 2. Create Campaigns Table
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

      -- 3. Create Review Sources Table (Campaign Tracking)
      CREATE TABLE IF NOT EXISTS review_sources (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name text NOT NULL,
        slug text NOT NULL,
        is_active boolean DEFAULT true,
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(business_id, slug)
      );
      CREATE INDEX IF NOT EXISTS ix_review_sources_business_id ON review_sources (business_id);

      -- 4. Link existing tables
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_requests' AND column_name='campaign_id') THEN
          ALTER TABLE review_requests ADD COLUMN campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;
        END IF;
      END $$;

      -- 4. CLEANUP: Remove duplicates from contacts table
      -- Keep the newest record for each (business_id, email) or (business_id, phone)
      DELETE FROM contacts a USING (
        SELECT MIN(ctid) as ctid, business_id, email
        FROM contacts 
        WHERE email IS NOT NULL
        GROUP BY business_id, email 
        HAVING COUNT(*) > 1
      ) b
      WHERE a.business_id = b.business_id 
      AND a.email = b.email 
      AND a.ctid <> b.ctid;

      DELETE FROM contacts a USING (
        SELECT MIN(ctid) as ctid, business_id, phone
        FROM contacts 
        WHERE phone IS NOT NULL
        GROUP BY business_id, phone 
        HAVING COUNT(*) > 1
      ) b
      WHERE a.business_id = b.business_id 
      AND a.phone = b.phone 
      AND a.ctid <> b.ctid;
    ` });

    if (error) {
      console.error('[DB-INIT] Error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        tip: "If you see 'function execute_sql(sql) does not exist', you need to enable it in Supabase SQL Editor."
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database tables created successfully! You can now upload your CSV." 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
