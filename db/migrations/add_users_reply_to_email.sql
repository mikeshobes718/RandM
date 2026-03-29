-- Customer reply-to for email outreach (optional override; null = use users.email)
ALTER TABLE users ADD COLUMN IF NOT EXISTS reply_to_email text;

COMMENT ON COLUMN users.reply_to_email IS 'Reply-To address for outreach; when null, sign-in email is used.';
