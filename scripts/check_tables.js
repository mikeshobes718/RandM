const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres({
  host: process.env.SUPABASE_DB_HOST,
  port: process.env.SUPABASE_DB_PORT,
  database: process.env.SUPABASE_DB_NAME,
  username: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: 'require',
  prepare: false,
});

async function check() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Existing tables:', tables.map(t => t.table_name).join(', '));
    
    const campaignsExists = tables.some(t => t.table_name === 'campaigns');
    const reviewSourcesExists = tables.some(t => t.table_name === 'review_sources');
    
    console.log('campaigns exists:', campaignsExists);
    console.log('review_sources exists:', reviewSourcesExists);
    
    if (!campaignsExists || !reviewSourcesExists) {
      console.log('Creating missing tables...');
      await sql`
        CREATE TABLE IF NOT EXISTS review_sources (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          name text NOT NULL,
          slug text NOT NULL,
          created_at timestamptz DEFAULT now(),
          UNIQUE(business_id, slug)
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS campaigns (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          name text NOT NULL,
          type text NOT NULL,
          body text NOT NULL,
          status text DEFAULT 'draft',
          sent_count integer DEFAULT 0,
          click_count integer DEFAULT 0,
          metadata jsonb DEFAULT '{}'::jsonb,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
      `;
      console.log('Tables created successfully!');
    }
    
    // Refresh schema cache
    await sql`NOTIFY pgrst, 'reload schema'`;
    console.log('PostgREST schema reload notified.');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

check();
