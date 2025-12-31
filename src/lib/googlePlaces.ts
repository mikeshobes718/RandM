import { getEnv } from './env';

// Primary: Places API (New) v1
async function v1Autocomplete(GOOGLE_MAPS_API_KEY: string, params: {
  input: string;
  sessionToken: string;
  includedRegionCodes?: string[];
  languageCode?: string;
  locationBias?: { lat: number; lng: number; radiusMeters?: number };
}) {
  const fields = [
    'suggestions.placePrediction.placeId',
    'suggestions.placePrediction.structuredFormat.mainText.text',
    'suggestions.placePrediction.structuredFormat.secondaryText.text',
  ].join(',');
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': fields,
    },
    body: JSON.stringify({
      input: params.input,
      sessionToken: params.sessionToken,
      includedRegionCodes: params.includedRegionCodes,
      languageCode: params.languageCode,
      ...(params.locationBias
        ? { locationBias: { circle: { center: { latitude: params.locationBias.lat, longitude: params.locationBias.lng }, radius: params.locationBias.radiusMeters || 50000 } } }
        : {}),
    }),
  });
  if (!res.ok) throw new Error(`v1_autocomplete_${res.status}`);
  return res.json();
}

// Fallback: legacy Places API autocomplete (if v1 not enabled)
async function legacyAutocomplete(GOOGLE_MAPS_API_KEY: string, params: {
  input: string;
  includedRegionCodes?: string[];
  languageCode?: string;
  locationBias?: { lat: number; lng: number; radiusMeters?: number };
}) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', params.input);
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
  if (params.languageCode) url.searchParams.set('language', params.languageCode);
  if (params.includedRegionCodes && params.includedRegionCodes.length === 1) {
    url.searchParams.set('components', `country:${params.includedRegionCodes[0]}`);
  }
  if (params.locationBias) {
    url.searchParams.set('location', `${params.locationBias.lat},${params.locationBias.lng}`);
    url.searchParams.set('radius', String(params.locationBias.radiusMeters || 50000));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`legacy_autocomplete_${res.status}`);
  const j = await res.json();
  type LegacyPred = { place_id: string; description?: string; structured_formatting?: { main_text?: string; secondary_text?: string } };
  return {
    suggestions: (j.predictions || []).map((p: LegacyPred) => ({
      placePrediction: {
        placeId: p.place_id,
        structuredFormat: {
          mainText: { text: p.structured_formatting?.main_text || p.description || '' },
          secondaryText: { text: p.structured_formatting?.secondary_text || '' },
        },
      },
    })),
  };
}

// Primary: Places API (New) v1
async function v1Details(GOOGLE_MAPS_API_KEY: string, placeId: string, sessionToken?: string) {
  const mask = [
    'id',
    'displayName',
    'formattedAddress',
    'rating',
    'userRatingCount',
    'location',
    'googleMapsUri',
    'googleMapsLinks.placeUri',
    'googleMapsLinks.writeAReviewUri',
    'googleMapsLinks.reviewsUri',
  ].join(',');
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': mask,
      ...(sessionToken ? { 'X-Goog-Session-Token': sessionToken } : {}),
    },
  });
  if (!res.ok) throw new Error(`v1_details_${res.status}`);
  return res.json();
}

// Fallback: legacy Places API details
async function legacyDetails(GOOGLE_MAPS_API_KEY: string, placeId: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
  url.searchParams.set('fields', 'place_id,name,formatted_address,rating,user_ratings_total,url,geometry/location');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`legacy_details_${res.status}`);
  const j = await res.json();
  const r = j.result || {};
  return {
    id: r.place_id,
    displayName: { text: r.name },
    formattedAddress: r.formatted_address,
    rating: r.rating,
    userRatingCount: r.user_ratings_total,
    googleMapsUri: r.url,
    googleMapsLinks: {},
    location: r.geometry?.location ? { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng } : undefined,
  };
}

export async function placesAutocomplete(input: string, sessionToken: string, includedRegionCodes?: string[], languageCode?: string, locationBias?: { lat: number; lng: number; radiusMeters?: number }) {
  const { GOOGLE_MAPS_API_KEY } = getEnv();
  try {
    return await v1Autocomplete(GOOGLE_MAPS_API_KEY, { input, sessionToken, includedRegionCodes, languageCode, locationBias });
  } catch {
    // Graceful fallback if v1 is disabled or returns an error
    return await legacyAutocomplete(GOOGLE_MAPS_API_KEY, { input, includedRegionCodes, languageCode, locationBias });
  }
}

export async function getPlaceDetails(placeId: string, sessionToken?: string) {
  const { GOOGLE_MAPS_API_KEY } = getEnv();
  try {
    const res = await v1Details(GOOGLE_MAPS_API_KEY, placeId, sessionToken);
    // If the ID we got back starts with Ei, it's a feature ID, not a standard Place ID.
    // Standard Place IDs start with ChIJ.
    if (res.id && res.id.startsWith('Ei')) {
      try {
        const legacy = await legacyDetails(GOOGLE_MAPS_API_KEY, placeId);
        if (legacy.id && legacy.id.startsWith('ChIJ')) {
          // Merge legacy ID into v1 response
          return { ...res, id: legacy.id };
        }
      } catch (e) {
        console.error('Legacy fallback failed for feature ID:', e);
      }
    }
    return res;
  } catch {
    return await legacyDetails(GOOGLE_MAPS_API_KEY, placeId);
  }
}

export function makeGoogleReviewLinkFromWriteUri(writeAReviewUri?: string, placeId?: string) {
  if (writeAReviewUri && !writeAReviewUri.includes('placeid=Ei')) return writeAReviewUri;
  
  if (placeId) {
    if (placeId.startsWith('Ei')) {
      // Feature ID fallback: use a search link with the fid if we can, 
      // but without the fid we can't easily make a direct "write review" link.
      // The best we can do is a search link that often triggers the knowledge panel.
      return `https://www.google.com/search?q=google+review+link&ludocid=${placeId}#lrd=0x0:0x0,3`;
    }
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
  }
  return '';
}
