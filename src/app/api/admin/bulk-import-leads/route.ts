import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';
import { searchBusinesses, getPlaceDetails } from '@/lib/googlePlaces';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Limited subset for API endpoint (can be expanded)
const CATEGORIES = [
  'bar', 'restaurant', 'gym', 'spa', 'dental_clinic',
  'hair_salon', 'auto_repair', 'plumber', 'electrician', 'lawyer',
  'accountant', 'real_estate_agency', 'car_dealer', 'furniture_store',
  'clothing_store', 'jewelry_store', 'bakery', 'cafe', 'pizza_restaurant',
  'fast_food_restaurant', 'hotel', 'pet_store', 'veterinary_care',
  'pharmacy', 'medical_clinic', 'hospital', 'chiropractor', 'physical_therapy',
];

const US_CITIES_BY_STATE: Record<string, string[]> = {
  NY: ['New York City', 'Brooklyn', 'Queens', 'Buffalo', 'Rochester'],
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose'],
  TX: ['Houston', 'Austin', 'Dallas', 'San Antonio', 'Fort Worth'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Fort Lauderdale', 'Jacksonville'],
  IL: ['Chicago', 'Naperville', 'Aurora'],
  GA: ['Atlanta', 'Savannah', 'Marietta'],
  PA: ['Philadelphia', 'Pittsburgh'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati'],
  NC: ['Charlotte', 'Raleigh'],
  MI: ['Detroit', 'Grand Rapids'],
};

async function importLeadsForCity(city: string, state: string, category: string) {
  const supa = getSupabaseAdmin();
  const location = `${city}, ${state}, US`;
  
  const searchVariations = [
    `${category} in ${location}`,
    `best ${category} in ${location}`,
    `top ${category} in ${location}`,
  ];

  let allPlaces: any[] = [];
  for (const searchQuery of searchVariations) {
    if (allPlaces.length >= 80) break;
    try {
      const places = await searchBusinesses(searchQuery);
      places.forEach((p: any) => {
        if (!allPlaces.find(ap => ap.id === p.id)) {
          allPlaces.push(p);
        }
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (e) {
      console.error(`Search failed for "${searchQuery}":`, e);
    }
  }

  const filteredLeads = allPlaces.filter(p => p.rating != null && p.rating <= 4.2);
  if (filteredLeads.length === 0) return 0;

  const batchSize = 10;
  const leadsWithDetails: any[] = [];
  
  for (let i = 0; i < Math.min(filteredLeads.length, 60); i += batchSize) {
    const batch = filteredLeads.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (p) => {
        if (p.nationalPhoneNumber || p.internationalPhoneNumber) {
          try {
            const details = await getPlaceDetails(p.id);
            return {
              ...p,
              phone: p.nationalPhoneNumber || p.internationalPhoneNumber,
              googleMapsUri: details.googleMapsUri || p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
              website: details.websiteUri || null,
            };
          } catch (e) {
            return {
              ...p,
              phone: p.nationalPhoneNumber || p.internationalPhoneNumber,
              googleMapsUri: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
              website: null,
            };
          }
        }
        try {
          const details = await getPlaceDetails(p.id);
          return {
            ...p,
            phone: details.nationalPhoneNumber || details.internationalPhoneNumber || null,
            googleMapsUri: details.googleMapsUri || p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
            website: details.websiteUri || null,
          };
        } catch (e) {
          return {
            ...p,
            phone: null,
            googleMapsUri: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
            website: null,
          };
        }
      })
    );
    leadsWithDetails.push(...batchResults);
    if (i + batchSize < filteredLeads.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const leadsToInsert = leadsWithDetails.map((p: any) => ({
    google_place_id: p.id,
    name: p.displayName?.text || 'Unknown',
    address: p.formattedAddress,
    rating: p.rating,
    review_count: p.userRatingCount || 0,
    business_type: category,
    city: city.toLowerCase(),
    state: state,
    country: 'US',
    phone: p.phone,
    google_maps_url: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
    website: p.website || null,
  }));

  const { error } = await supa
    .from('leads')
    .upsert(leadsToInsert, { onConflict: 'google_place_id' });

  if (error) {
    console.error(`Database error for ${city}, ${state}, ${category}:`, error);
    return 0;
  }

  return leadsToInsert.length;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tokenQ = url.searchParams.get('token') || '';
  const tokenH = req.headers.get('x-admin-token') || '';
  const token = tokenH || tokenQ;
  const { ADMIN_TOKEN } = getEnv();
  
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return new NextResponse('forbidden', { status: 403 });
  }

  try {
    const { limitCities, limitCategories, startState, startCity, startCategory } = await req.json().catch(() => ({}));
    
    let totalImported = 0;
    const stateKeys = Object.keys(US_CITIES_BY_STATE);
    const results: any[] = [];
    
    // Allow resuming from a specific point
    let startProcessing = !startState;
    
    for (const state of stateKeys) {
      if (startState && !startProcessing) {
        if (state === startState) {
          startProcessing = true;
        } else {
          continue;
        }
      }
      
      const cities = limitCities 
        ? US_CITIES_BY_STATE[state].slice(0, limitCities)
        : US_CITIES_BY_STATE[state];
      
      let cityStartProcessing = !startCity || !startProcessing;
      
      for (const city of cities) {
        if (startCity && !cityStartProcessing) {
          if (city === startCity) {
            cityStartProcessing = true;
          } else {
            continue;
          }
        }
        
        const categories = limitCategories
          ? CATEGORIES.slice(0, limitCategories)
          : CATEGORIES;
          
        let categoryStartProcessing = !startCategory || !cityStartProcessing;
        
        for (const category of categories) {
          if (startCategory && !categoryStartProcessing) {
            if (category === startCategory) {
              categoryStartProcessing = true;
            } else {
              continue;
            }
          }
          
          try {
            const count = await importLeadsForCity(city, state, category);
            totalImported += count;
            results.push({ city, state, category, count });
            
            // Log progress every 10 imports
            if (results.length % 10 === 0) {
              console.log(`[BULK IMPORT] Progress: ${totalImported} leads imported so far...`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 300)); // Reduced delay
          } catch (e: any) {
            console.error(`Error importing ${category} in ${city}, ${state}:`, e);
            results.push({ city, state, category, error: e.message });
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced delay
      }
    }

    return NextResponse.json({
      success: true,
      totalImported,
      resultsCount: results.length,
      sampleResults: results.slice(0, 10), // Return first 10 for preview
      message: `Bulk import complete! Imported ${totalImported} leads across ${results.length} city/category combinations.`,
    });
  } catch (error: any) {
    console.error('[BULK IMPORT] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

