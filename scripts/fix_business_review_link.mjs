import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUSINESS_ID = process.argv[2];
const REVIEW_LINK = process.argv[3];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!BUSINESS_ID || !REVIEW_LINK) {
  console.error('Usage: node scripts/fix_business_review_link.mjs <businessId> <reviewLink>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { error } = await supabase
  .from('businesses')
  .update({ review_link: REVIEW_LINK })
  .eq('id', BUSINESS_ID);

if (error) {
  console.error('Failed to update:', error);
  process.exit(1);
}

console.log('Updated review_link for', BUSINESS_ID);
