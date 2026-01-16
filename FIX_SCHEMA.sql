-- Add missing email tracking column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_called_by_email text;

-- Rename lead_notes to notes if it exists, or just ensure notes exists
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='lead_notes') THEN
    ALTER TABLE leads RENAME COLUMN lead_notes TO notes;
  END IF;
END $$;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;
