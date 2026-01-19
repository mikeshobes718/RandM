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
    const { contacts } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 });
    }

    const supa = getSupabaseAdmin();

    // --- ONE-TIME SETUP LOGIC ---
    try {
      await supa.rpc('execute_sql', { sql: `
        CREATE TABLE IF NOT EXISTS contacts (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          name text, email text, phone text, source text DEFAULT 'manual', metadata jsonb DEFAULT '{}'::jsonb,
          created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS ix_contacts_business_id ON contacts (business_id);
        CREATE INDEX IF NOT EXISTS ix_contacts_email ON contacts (email);
        CREATE INDEX IF NOT EXISTS ix_contacts_phone ON contacts (phone);

        CREATE TABLE IF NOT EXISTS campaigns (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          name text NOT NULL, type text NOT NULL, body text NOT NULL, status text DEFAULT 'draft',
          sent_count integer DEFAULT 0, click_count integer DEFAULT 0, metadata jsonb DEFAULT '{}'::jsonb,
          created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS ix_campaigns_business_id ON campaigns (business_id);

        -- Add unique constraints for de-duplication (scoped to business)
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_contacts_business_email') THEN
            ALTER TABLE contacts ADD CONSTRAINT uq_contacts_business_email UNIQUE (business_id, email);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_contacts_business_phone') THEN
            ALTER TABLE contacts ADD CONSTRAINT uq_contacts_business_phone UNIQUE (business_id, phone);
          END IF;
        END $$;
      ` });
    } catch (e) {
      console.warn('[CONTACTS IMPORT] RPC execute_sql failed or not available');
    }
    // ----------------------------

    // Get the user's business
    const { data: biz } = await supa
      .from('businesses')
      .select('id')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ error: 'No business found. Please complete setup first.' }, { status: 400 });
    }

    // 1. Fetch existing contacts for this business to avoid duplicates
    const { data: existingContacts } = await supa
      .from('contacts')
      .select('email, phone')
      .eq('business_id', biz.id);

    const existingEmails = new Set(existingContacts?.map(c => c.email?.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(existingContacts?.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean));

    // Prepare contacts for insert, filtering out duplicates
    const contactsToInsert = contacts
      .map((c: any) => ({
        business_id: biz.id,
        name: c.name || null,
        email: c.email?.toLowerCase() || null,
        phone: c.phone || null,
        source: c.source || 'csv_upload',
      }))
      .filter((c: any) => {
        // Only include if neither email nor phone is already in the DB
        const hasExistingEmail = c.email && existingEmails.has(c.email);
        const hasExistingPhone = c.phone && existingPhones.has(c.phone.replace(/\D/g, ''));
        return !hasExistingEmail && !hasExistingPhone;
      });

    if (contactsToInsert.length === 0) {
      return NextResponse.json({ 
        imported: 0, 
        message: 'All contacts were already in your list. No new duplicates added.' 
      });
    }

    // Try to insert
    const { data: inserted, error } = await supa
      .from('contacts')
      .insert(contactsToInsert)
      .select();

    if (error) {
      console.error('[CONTACTS IMPORT] Insert failed:', error);
      throw new Error('Failed to import contacts. Please ensure the contacts table is set up.');
    }

    return NextResponse.json({ 
      imported: inserted?.length || contactsToInsert.length,
      message: 'Contacts imported successfully'
    });
  } catch (error: any) {
    console.error('[CONTACTS IMPORT API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
