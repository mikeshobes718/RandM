import { getPlaceDetails } from './src/lib/googlePlaces';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function check() {
  const placeId = 'ChIJ2axTb4QpRI4R_I8Nrf0xWI0';
  const details = await getPlaceDetails(placeId);
  console.log('Details:', JSON.stringify(details, null, 2));
}

check().catch(console.error);
