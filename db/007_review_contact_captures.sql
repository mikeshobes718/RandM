-- Create table for 5-star review contact captures (for rebates/promotions)
CREATE TABLE IF NOT EXISTS review_contact_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  consent BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'landing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by business
CREATE INDEX IF NOT EXISTS idx_review_contact_captures_business_id ON review_contact_captures(business_id);

-- Index for querying by email
CREATE INDEX IF NOT EXISTS idx_review_contact_captures_email ON review_contact_captures(email);

-- Index for querying by created date
CREATE INDEX IF NOT EXISTS idx_review_contact_captures_created_at ON review_contact_captures(created_at DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_review_contact_captures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_contact_captures_updated_at
  BEFORE UPDATE ON review_contact_captures
  FOR EACH ROW
  EXECUTE FUNCTION update_review_contact_captures_updated_at();

-- Comment
COMMENT ON TABLE review_contact_captures IS 'Stores contact information from customers who left 5-star reviews for rebates/promotions';

