import { searchBusinesses, getPlaceDetails } from '../src/lib/googlePlaces';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CATEGORIES = [
  'bar', 'restaurant', 'gym', 'spa', 'dental_clinic',
  'hair_salon', 'auto_repair', 'plumber', 'electrician', 'lawyer',
  'accountant', 'real_estate_agency', 'car_dealer', 'furniture_store',
  'clothing_store', 'jewelry_store', 'bakery', 'cafe', 'pizza_restaurant',
  'fast_food_restaurant', 'hotel', 'pet_store', 'veterinary_care',
  'pharmacy', 'medical_clinic', 'hospital', 'chiropractor', 'physical_therapy',
];

const US_CITIES_BY_STATE: Record<string, string[]> = {
  NY: ['New York City', 'Brooklyn', 'Queens', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers'],
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Oakland', 'Long Beach'],
  TX: ['Houston', 'Austin', 'Dallas', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Fort Lauderdale', 'Jacksonville', 'Tallahassee'],
  IL: ['Chicago', 'Naperville', 'Aurora', 'Rockford'],
  GA: ['Atlanta', 'Savannah', 'Marietta', 'Augusta'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'],
  MI: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Chandler'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
};

async function importLeadsForCity(city: string, state: string, category: string) {
  console.log(`🔍 Searching ${category} in ${city}, ${state}...`);
  const location = `${city}, ${state}, US`;
  
  const searchVariations = [
    `${category} in ${location}`,
    `best ${category} in ${location}`,
    `top ${category} in ${location}`,
  ];

  let allPlaces: any[] = [];
  for (const searchQuery of searchVariations) {
    if (allPlaces.length >= 60) break;
    try {
      const places = await searchBusinesses(searchQuery);
      places.forEach((p: any) => {
        if (!allPlaces.find(ap => ap.id === p.id)) {
          allPlaces.push(p);
        }
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.error(`   ❌ Search failed for "${searchQuery}"`);
    }
  }

  const filteredLeads = allPlaces.filter(p => p.rating != null && p.rating <= 4.2);
  if (filteredLeads.length === 0) {
    console.log(`   ⚠️ No low-rated leads found.`);
    return 0;
  }

  console.log(`   ✨ Found ${filteredLeads.length} potential leads. Fetching details...`);

  const leadsWithDetails: any[] = [];
  const batchSize = 5;
  
  for (let i = 0; i < Math.min(filteredLeads.length, 40); i += batchSize) {
    const batch = filteredLeads.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (p) => {
        try {
          const details = await getPlaceDetails(p.id);
          return {
            ...p,
            phone: details.nationalPhoneNumber || details.internationalPhoneNumber || p.nationalPhoneNumber || p.internationalPhoneNumber || null,
            googleMapsUri: details.googleMapsUri || p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
            website: details.websiteUri || null,
          };
        } catch (e) {
          return {
            ...p,
            phone: p.nationalPhoneNumber || p.internationalPhoneNumber || null,
            googleMapsUri: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
            website: null,
          };
        }
      })
    );
    leadsWithDetails.push(...batchResults);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const leadsToInsert = leadsWithDetails.map((p: any) => ({
    google_place_id: p.id,
    name: p.displayName?.text || 'Unknown',
    address: p.formattedAddress,
    rating: p.rating,
    review_count: p.userRatingCount || 0,
    business_type: category,
    city: city.toLowerCase().replace(/ city$/, '').trim(),
    state: state,
    country: 'US',
    phone: p.phone,
    google_maps_url: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
    website: p.website || null,
  }));

  if (leadsToInsert.length === 0) return 0;

  const { error } = await supa
    .from('leads')
    .upsert(leadsToInsert, { onConflict: 'google_place_id' });

  if (error) {
    console.error(`   ❌ DB Error:`, error.message);
    return 0;
  }

  console.log(`   ✅ Successfully imported ${leadsToInsert.length} leads.`);
  return leadsToInsert.length;
}

async function main() {
  console.log('🚀 Starting Local Lead Population...');
  let totalImported = 0;
  
  for (const state of Object.keys(US_CITIES_BY_STATE)) {
    for (const city of US_CITIES_BY_STATE[state]) {
      // Check how many leads we already have for this city
      const normalizedCity = city.toLowerCase().replace(/ city$/, '').trim();
      const { count: existingCount } = await supa
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('city', normalizedCity);
      
      console.log(`\n🏙️  City: ${city}, ${state} (Existing leads: ${existingCount || 0})`);
      
      if ((existingCount || 0) >= 250) {
        console.log(`   ⏩ Skipping, already have ${existingCount} leads.`);
        continue;
      }

      let cityTotal = existingCount || 0;
      
      // Shuffle categories to get a variety
      const shuffledCategories = [...CATEGORIES].sort(() => Math.random() - 0.5);
      
      for (const category of shuffledCategories) {
        if (cityTotal >= 300) break;
        
        try {
          const count = await importLeadsForCity(city, state, category);
          cityTotal += count;
          totalImported += count;
          
          if (count > 0) {
            console.log(`   📊 Total for ${city}: ${cityTotal}`);
          }
          
          // Small delay between categories
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e: any) {
          console.error(`   ❌ Error:`, e.message);
        }
      }
    }
  }
  
  console.log(`\n🎉 DONE! Total leads imported in this session: ${totalImported}`);
}

main().catch(console.error);
