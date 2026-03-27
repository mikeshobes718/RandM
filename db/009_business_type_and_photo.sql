-- Onboarding / Places: fields sent by BusinessSetupForm + dashboard enrichment
alter table businesses add column if not exists business_type text;
alter table businesses add column if not exists google_photo_url text;
