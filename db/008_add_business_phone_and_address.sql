-- Add missing columns to businesses table
alter table businesses add column if not exists contact_phone text;
alter table businesses add column if not exists address text;
alter table businesses add column if not exists google_maps_place_uri text;
alter table businesses add column if not exists google_maps_write_review_uri text;























