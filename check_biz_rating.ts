import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function check() {
  const supa = getSupabaseAdmin();
  const { data: businesses, error } = await supa
    .from('businesses')
    .select('id, name, google_rating, google_place_id, owner_uid');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total businesses:', businesses?.length);
  businesses?.forEach(b => {
    console.log(`Business: ${b.name}, ID: ${b.id}, Rating: ${b.google_rating}, PlaceID: ${b.google_place_id}`);
  });
}

check();
