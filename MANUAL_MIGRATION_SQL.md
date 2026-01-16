# Manual Database Migration

Run this SQL in your Supabase Dashboard SQL Editor:
**Dashboard > SQL Editor > New Query > Paste & Run**

```sql
-- ============================================
-- ADMIN DASHBOARD & SALES PORTAL TABLES
-- Run this SQL in Supabase Dashboard
-- ============================================

-- Enable pgcrypto if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. LEADS TABLE (for Lead Finder)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id text UNIQUE NOT NULL,
  name text NOT NULL,
  address text,
  rating numeric,
  review_count integer DEFAULT 0,
  business_type text,
  city text,
  state text,
  country text,
  phone text,
  google_maps_url text,
  website text,
  -- Call tracking fields
  assigned_to uuid,
  status text DEFAULT 'fresh' CHECK (status IN ('fresh', 'called', 'follow-up', 'closed', 'dead')),
  last_contact timestamptz,
  times_called integer DEFAULT 0,
  last_called_at timestamptz,
  last_called_by uuid,
  call_status text DEFAULT 'fresh' CHECK (call_status IN ('fresh', 'no answer', 'left vm', 'spoke to dm', 'callback', 'not interested', 'closed')),
  next_followup date,
  lead_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_city_type_idx ON leads(city, business_type);
CREATE INDEX IF NOT EXISTS leads_call_status_idx ON leads(call_status);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads(assigned_to);

-- ============================================
-- 2. REPS TABLE (Sales Representatives)
-- ============================================
CREATE TABLE IF NOT EXISTS reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  whatsapp text,
  payment_method text CHECK (payment_method IN ('Wise', 'Payoneer')),
  payment_id text,
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'inactive', 'dropped')),
  start_date timestamptz DEFAULT now(),
  tracking_code text UNIQUE NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reps_status_idx ON reps(status);
CREATE INDEX IF NOT EXISTS reps_tracking_code_idx ON reps(tracking_code);

-- ============================================
-- 3. CALL LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid REFERENCES reps(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  outcome text NOT NULL CHECK (outcome IN ('no answer', 'left vm', 'spoke to dm', 'callback', 'not interested', 'closed')),
  notes text,
  followup_date date,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_log_rep_id_idx ON call_log(rep_id);
CREATE INDEX IF NOT EXISTS call_log_lead_id_idx ON call_log(lead_id);
CREATE INDEX IF NOT EXISTS call_log_timestamp_idx ON call_log(timestamp);

-- ============================================
-- 4. COMMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('close', 'month2', 'month3', 'bonus')),
  amount numeric NOT NULL,
  earned_date timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid')),
  paid_date timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commissions_rep_id_idx ON commissions(rep_id);
CREATE INDEX IF NOT EXISTS commissions_status_idx ON commissions(status);

-- ============================================
-- 5. PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date_paid timestamptz DEFAULT now(),
  method text CHECK (method IN ('Wise', 'Payoneer')),
  reference text,
  commission_ids uuid[],
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payouts_rep_id_idx ON payouts(rep_id);

-- ============================================
-- 6. ADMIN SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Insert default commission structure
INSERT INTO admin_settings (key, value) VALUES 
('commission_structure', '{"first_close_percent": 100, "month2_retention_percent": 25, "month3_retention_percent": 25, "bonus_10_closes": 100, "bonus_20_closes": 250}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 7. ADD COLUMNS TO BUSINESSES TABLE
-- ============================================
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES reps(id) ON DELETE SET NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS notes text;

-- ============================================
-- 8. ADD FOREIGN KEYS TO LEADS
-- ============================================
-- Note: Run these separately if you get constraint errors
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES reps(id) ON DELETE SET NULL;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_last_called_by_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_last_called_by_fkey 
  FOREIGN KEY (last_called_by) REFERENCES reps(id) ON DELETE SET NULL;

-- ============================================
-- DONE! Your admin dashboard is now ready.
-- ============================================
```

## Quick Verification

After running the SQL, verify tables exist:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'reps', 'call_log', 'commissions', 'payouts', 'admin_settings');
```

You should see all 6 tables listed.
