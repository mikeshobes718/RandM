/**
 * Bulk import script to populate the leads database with thousands of leads
 * across multiple categories and cities in the USA
 */

import { getEnv } from '../src/lib/env';
import { searchBusinesses, getPlaceDetails } from '../src/lib/googlePlaces';
import { getSupabaseAdmin } from '../src/lib/supabaseAdmin';

const CATEGORIES = [
  'bar',
  'restaurant',
  'gym',
  'spa',
  'dental_clinic',
  'hair_salon',
  'auto_repair',
  'plumber',
  'electrician',
  'lawyer',
  'accountant',
  'real_estate_agency',
  'car_dealer',
  'furniture_store',
  'clothing_store',
  'jewelry_store',
  'bakery',
  'cafe',
  'pizza_restaurant',
  'fast_food_restaurant',
  'hotel',
  'motel',
  'pet_store',
  'veterinary_care',
  'pharmacy',
  'medical_clinic',
  'hospital',
  'dentist',
  'chiropractor',
  'physical_therapy',
];

const US_CITIES_BY_STATE: Record<string, string[]> = {
  NY: ['New York City', 'Brooklyn', 'Queens', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers', 'Utica', 'White Plains'],
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Oakland', 'Fresno', 'Long Beach', 'Anaheim', 'Santa Ana'],
  TX: ['Houston', 'Austin', 'Dallas', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Laredo'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Fort Lauderdale', 'Jacksonville', 'Tallahassee', 'St. Petersburg', 'Hialeah', 'Port St. Lucie', 'Cape Coral'],
  IL: ['Chicago', 'Naperville', 'Aurora', 'Rockford', 'Joliet', 'Springfield', 'Peoria', 'Elgin', 'Waukegan', 'Cicero'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'Altoona'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton', 'Youngstown', 'Lorain'],
  GA: ['Atlanta', 'Savannah', 'Marietta', 'Augusta', 'Columbus', 'Athens', 'Sandy Springs', 'Roswell', 'Macon', 'Johns Creek'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington', 'High Point', 'Concord'],
  MI: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing', 'Ann Arbor', 'Flint', 'Dearborn', 'Livonia', 'Troy'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge', 'Lakewood', 'Toms River', 'Hamilton', 'Trenton'],
  VA: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Hampton', 'Portsmouth', 'Suffolk', 'Roanoke'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Renton', 'Yakima', 'Federal Way'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe', 'Peoria', 'Surprise'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge', 'New Bedford', 'Brockton', 'Quincy', 'Lynn', 'Fall River'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Murfreesboro', 'Franklin', 'Jackson', 'Johnson City', 'Bartlett', 'Hendersonville'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers', 'Bloomington', 'Hammond', 'Gary', 'Muncie'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit', 'O\'Fallon', 'St. Joseph', 'St. Charles', 'St. Peters'],
  MD: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie', 'Annapolis', 'College Park', 'Salisbury', 'Laurel', 'Greenbelt'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha', 'Oshkosh', 'Eau Claire', 'Janesville'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton', 'Arvada', 'Westminster', 'Pueblo', 'Centennial'],
  MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington', 'Brooklyn Park', 'Plymouth', 'St. Cloud', 'Eagan', 'Woodbury'],
  SC: ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville', 'Summerville', 'Sumter', 'Hilton Head Island', 'Florence'],
  AL: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa', 'Hoover', 'Dothan', 'Auburn', 'Decatur', 'Madison'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner', 'Bossier City', 'Monroe', 'Alexandria', 'Houma'],
  KY: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Hopkinsville', 'Richmond', 'Florence', 'Georgetown', 'Henderson'],
  OR: ['Portland', 'Eugene', 'Salem', 'Gresham', 'Hillsboro', 'Bend', 'Beaverton', 'Medford', 'Springfield', 'Corvallis'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton', 'Edmond', 'Moore', 'Midwest City', 'Enid', 'Stillwater'],
  CT: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury', 'Norwalk', 'Danbury', 'New Britain', 'West Hartford', 'Greenwich'],
  UT: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy', 'Ogden', 'St. George', 'Layton', 'Taylorsville'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo', 'Council Bluffs', 'Ames', 'West Des Moines', 'Dubuque'],
  NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City', 'Fernley', 'Elko', 'Mesquite', 'Boulder City'],
  AR: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro', 'North Little Rock', 'Conway', 'Rogers', 'Pine Bluff', 'Bentonville'],
  MS: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian', 'Tupelo', 'Greenville', 'Olive Branch', 'Horn Lake'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence', 'Shawnee', 'Manhattan', 'Lenexa', 'Salina'],
  NM: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington', 'Clovis', 'Hobbs', 'Alamogordo', 'Carlsbad'],
  NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont', 'Hastings', 'North Platte', 'Norfolk', 'Columbus'],
  WV: ['Charleston', 'Huntington', 'Parkersburg', 'Morgantown', 'Wheeling', 'Martinsburg', 'Fairmont', 'Beckley', 'Clarksburg', 'South Charleston'],
  ID: ['Boise', 'Nampa', 'Meridian', 'Idaho Falls', 'Pocatello', 'Caldwell', 'Coeur d\'Alene', 'Twin Falls', 'Lewiston', 'Post Falls'],
  HI: ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Kaneohe', 'Kahului', 'Ewa Beach', 'Mililani', 'Kihei', 'Makakilo'],
  NH: ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester', 'Dover', 'Salem', 'Merrimack', 'Londonderry', 'Hudson'],
  ME: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford', 'Sanford', 'Saco', 'Augusta', 'Westbrook'],
  RI: ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket', 'Newport', 'Central Falls', 'Westerly', 'Cumberland'],
  MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena', 'Kalispell', 'Havre', 'Anaconda', 'Miles City'],
  DE: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford', 'Seaford', 'Georgetown', 'Elsmere', 'Laurel'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Mitchell', 'Yankton', 'Pierre', 'Huron', 'Vermillion'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston', 'Dickinson', 'Mandan', 'Jamestown', 'Wahpeton'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau', 'Wasilla', 'Sitka', 'Ketchikan', 'Kenai', 'Kodiak', 'Bethel', 'Palmer'],
  VT: ['Burlington', 'Essex', 'South Burlington', 'Colchester', 'Rutland', 'Montpelier', 'Barre', 'St. Albans', 'Brattleboro', 'Milton'],
  WY: ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan', 'Green River', 'Evanston', 'Riverton', 'Jackson'],
};

async function importLeadsForCity(city: string, state: string, category: string) {
  const supa = getSupabaseAdmin();
  const location = `${city}, ${state}, US`;
  
  console.log(`\n📍 Importing ${category} in ${city}, ${state}...`);
  
  // Search variations to get more results
  const searchVariations = [
    `${category} in ${location}`,
    `best ${category} in ${location}`,
    `top ${category} in ${location}`,
    `${category} establishments in ${location}`,
  ];

  let allPlaces: any[] = [];
  for (const searchQuery of searchVariations) {
    if (allPlaces.length >= 100) break; // Limit per city to avoid quota issues
    try {
      const places = await searchBusinesses(searchQuery);
      places.forEach((p: any) => {
        if (!allPlaces.find(ap => ap.id === p.id)) {
          allPlaces.push(p);
        }
      });
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (e) {
      console.error(`  ⚠️  Search failed for "${searchQuery}":`, e);
    }
  }

  // Filter for low-rated leads (4.2 or lower)
  const filteredLeads = allPlaces.filter(p => p.rating != null && p.rating <= 4.2);
  console.log(`  Found ${filteredLeads.length} low-rated businesses`);

  if (filteredLeads.length === 0) {
    return 0;
  }

  // Fetch details for each lead to get phone numbers and websites
  // Process in batches to avoid overwhelming the API
  const batchSize = 10;
  const leadsWithDetails: any[] = [];
  
  for (let i = 0; i < Math.min(filteredLeads.length, 60); i += batchSize) {
    const batch = filteredLeads.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (p) => {
        if (p.nationalPhoneNumber || p.internationalPhoneNumber) {
          // Still fetch details for website
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
    
    // Rate limiting delay between batches
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

  // Upsert into leads table
  const { error } = await supa
    .from('leads')
    .upsert(leadsToInsert, { onConflict: 'google_place_id' });

  if (error) {
    console.error(`  ❌ Database error:`, error);
    return 0;
  }

  console.log(`  ✅ Imported ${leadsToInsert.length} leads`);
  return leadsToInsert.length;
}

async function bulkImport() {
  console.log('🚀 Starting bulk import of leads...\n');
  
  let totalImported = 0;
  const stateKeys = Object.keys(US_CITIES_BY_STATE);
  
  // Process each state
  for (const state of stateKeys) {
    const cities = US_CITIES_BY_STATE[state];
    console.log(`\n🗺️  Processing ${state} (${cities.length} cities)...`);
    
    // Process each city
    for (const city of cities) {
      // Process each category
      for (const category of CATEGORIES) {
        try {
          const count = await importLeadsForCity(city, state, category);
          totalImported += count;
          
          // Rate limiting delay between city/category combinations
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.error(`  ❌ Error importing ${category} in ${city}, ${state}:`, e);
        }
      }
      
      // Longer delay between cities
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n\n✨ Bulk import complete! Total leads imported: ${totalImported}`);
}

// Run if executed directly
if (require.main === module) {
  bulkImport().catch(console.error);
}

export { bulkImport };

