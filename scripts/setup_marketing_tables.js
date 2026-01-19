const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function run() {
  let connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!connectionString && process.env.SUPABASE_DB_HOST) {
    connectionString = `postgres://${process.env.SUPABASE_DB_USER}:${process.env.SUPABASE_DB_PASSWORD}@${process.env.SUPABASE_DB_HOST}:${process.env.SUPABASE_DB_PORT}/${process.env.SUPABASE_DB_NAME}`;
  }

  if (!connectionString) {
    console.error('No DB connection string found');
    return;
  }

  const pool = new Pool({ 
    connectionString, 
    ssl: { rejectUnauthorized: false } 
  });

  const sql = `
    -- Contacts table
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

    -- Campaigns table
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

    -- Add campaign_id to review_requests to link them
    ALTER TABLE review_requests ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS ix_review_requests_campaign_id ON review_requests (campaign_id);
  `;

  try {
    console.log('Setting up marketing tables...');
    await pool.query(sql);
    console.log('✅ Marketing tables set up successfully!');
  } catch (err) {
    console.error('❌ Failed to set up marketing tables:', err);
  } finally {
    await pool.end();
  }
}

run();
