-- Newsletter subscribers table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email TEXT PRIMARY KEY,
  subscribed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  unsubscribed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed ON newsletter_subscribers(subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_source ON newsletter_subscribers(source);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access to newsletter_subscribers"
ON newsletter_subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can view (for admin dashboard)
CREATE POLICY "Authenticated users can view newsletter_subscribers"
ON newsletter_subscribers
FOR SELECT
TO authenticated
USING (true);

COMMENT ON TABLE newsletter_subscribers IS 'Email newsletter subscribers from website signup forms';
COMMENT ON COLUMN newsletter_subscribers.email IS 'Subscriber email address (primary key)';
COMMENT ON COLUMN newsletter_subscribers.source IS 'Where the subscription came from (e.g., website, exit-intent, footer)';
COMMENT ON COLUMN newsletter_subscribers.status IS 'Subscription status: active, unsubscribed, or bounced';
COMMENT ON COLUMN newsletter_subscribers.metadata IS 'Additional data (referrer, UTM params, etc.)';
