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
    'suggestions.placePrediction.types',
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
      // Prefer business establishments over addresses
      includedPrimaryTypes: ['establishment'],
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
    'types',
    'primaryType',
    'businessStatus',
    'photos',
    'nationalPhoneNumber',
    'internationalPhoneNumber',
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
  url.searchParams.set('fields', 'place_id,name,formatted_address,rating,user_ratings_total,url,geometry/location,types,business_status,photos,formatted_phone_number,international_phone_number');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`legacy_details_${res.status}`);
  const j = await res.json();
  const r = j.result || {};
  
  const photos = (r.photos || []).map((p: any) => ({
    name: p.photo_reference, // Map to a similar structure as v1 if needed, but legacy uses photo_reference
    widthPx: p.width,
    heightPx: p.height,
  }));

  let photoUrl: string | undefined = undefined;
  if (r.photos && r.photos.length > 0) {
    const ref = r.photos[0].photo_reference;
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${GOOGLE_MAPS_API_KEY}`;
  }

  return {
    id: r.place_id,
    displayName: { text: r.name },
    formattedAddress: r.formatted_address,
    rating: r.rating,
    userRatingCount: r.user_ratings_total,
    googleMapsUri: r.url,
    googleMapsLinks: {},
    location: r.geometry?.location ? { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng } : undefined,
    types: r.types || [],
    primaryType: r.types?.[0],
    businessStatus: r.business_status,
    photos: photos,
    legacyPhotos: r.photos, // Keep original just in case
    photoUrl: photoUrl,
    businessType: r.types?.[0] ? r.types[0].replace(/_/g, ' ') : undefined,
    nationalPhoneNumber: r.formatted_phone_number,
    internationalPhoneNumber: r.international_phone_number,
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
    
    // Add a convenient photoUrl property if photos exist
    let photoUrl: string | undefined = undefined;
    let businessType: string | undefined = res.primaryType ? res.primaryType.replace(/_/g, ' ') : (res.types?.[0] ? res.types[0].replace(/_/g, ' ') : undefined);
    
    if (res.photos && res.photos.length > 0) {
      const photoName = res.photos[0].name;
      photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_MAPS_API_KEY}&maxWidthPx=800`;
    } else {
      // Try legacy fallback for photos if v1 didn't return any
      try {
        const legacy = await legacyDetails(GOOGLE_MAPS_API_KEY, placeId);
        photoUrl = legacy.photoUrl;
      } catch (e) {
        console.error('[GOOGLE PLACES] Legacy fallback failed:', e);
      }
    }

    return { ...res, photoUrl, businessType };
  } catch (err) {
    console.error('[GOOGLE PLACES] v1 details failed, falling back to legacy:', err);
    return await legacyDetails(GOOGLE_MAPS_API_KEY, placeId);
  }
}

export function makeGoogleReviewLinkFromWriteUri(writeAReviewUri?: string, placeId?: string) {
  if (writeAReviewUri && !writeAReviewUri.includes('placeid=Ei')) return writeAReviewUri;
  
  if (placeId) {
    let targetId = placeId;
    
    // If it's a long Feature ID containing a standard Place ID, extract it
    if (placeId.startsWith('Ei') && placeId.includes('ChIJ')) {
      const match = placeId.match(/ChIJ[a-zA-Z0-9_-]+/);
      if (match) targetId = match[0];
    }

    if (targetId.startsWith('Ei')) {
      // Feature ID fallback: use a search link with the ludocid
      return `https://www.google.com/search?q=google+review+link&ludocid=${targetId}#lrd=0x0:0x0,3`;
    }
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(targetId)}`;
  }
  return '';
}

/**
 * Fetches actual customer reviews from Google for a given place.
 */
export async function getPlaceReviews(placeId: string) {
  const { GOOGLE_MAPS_API_KEY } = getEnv();
  // Standard IDs are required for reviews fetch
  let targetId = placeId;
  if (placeId.startsWith('Ei') && placeId.includes('ChIJ')) {
    const match = placeId.match(/ChIJ[a-zA-Z0-9_-]+/);
    if (match) targetId = match[0];
  }

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(targetId)}`;
  const mask = 'reviews';
  try {
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': mask,
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.reviews || [];
  } catch (error) {
    console.error('[GOOGLE PLACES] Failed to fetch reviews:', error);
    return [];
  }
}

export async function searchBusinesses(query: string) {
  const { GOOGLE_MAPS_API_KEY } = getEnv();
  const fields = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.rating',
    'places.userRatingCount',
    'places.types',
                'places.primaryType',
                'places.nationalPhoneNumber',
                'places.internationalPhoneNumber',
                'places.googleMapsUri',
              ].join(',');

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': fields,
      },
      body: JSON.stringify({
        textQuery: query,
        // Boost business results
        includedType: 'establishment',
      }),
    });

    if (!res.ok) {
      // Fallback to legacy text search if v1 fails
      const legacyUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
      legacyUrl.searchParams.set('query', query);
      legacyUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);
      const legacyRes = await fetch(legacyUrl.toString());
      const data = await legacyRes.json();
      return (data.results || []).map((r: any) => ({
        id: r.place_id,
        displayName: { text: r.name },
        formattedAddress: r.formatted_address,
        rating: r.rating,
        userRatingCount: r.user_ratings_total,
        nationalPhoneNumber: r.formatted_phone_number, // Legacy might not have this in text search, usually requires details
      }));
    }

    const data = await res.json();
    return data.places || [];
  } catch (error) {
    console.error('[GOOGLE PLACES] Search failed:', error);
    return [];
  }
}

/**
 * Validates if a place is a legitimate business that can receive reviews.
 * Returns { isValid: boolean, reason?: string, suggestion?: string }
 */
export function validateBusinessPlace(placeDetails: any): { 
  isValid: boolean; 
  reason?: string; 
  suggestion?: string;
  warningLevel?: 'error' | 'warning';
} {
  const types = placeDetails?.types || [];
  const primaryType = placeDetails?.primaryType;
  
  // Definite non-businesses that should be blocked
  const invalidTypes = [
    'street_address',
    'route',
    'neighborhood',
    'sublocality',
    'locality',
    'administrative_area_level_1',
    'administrative_area_level_2',
    'administrative_area_level_3',
    'administrative_area_level_4',
    'administrative_area_level_5',
    'country',
    'postal_code',
    'postal_code_prefix',
    'postal_town',
    'premise',
    'subpremise',
    'natural_feature',
    'park',
    'intersection',
    'political',
  ];

  // Check if it's primarily a non-business type
  if (invalidTypes.includes(primaryType)) {
    return {
      isValid: false,
      warningLevel: 'error',
      reason: `This appears to be a ${primaryType.replace(/_/g, ' ')} rather than a business.`,
      suggestion: 'Please search for and select an actual business name (e.g., "Joe\'s Pizza" instead of "123 Main St").',
    };
  }

  // Check if any invalid type is present (softer warning)
  const hasInvalidType = types.some((t: string) => invalidTypes.includes(t));
  if (hasInvalidType && !types.includes('establishment') && !types.includes('point_of_interest')) {
    return {
      isValid: false,
      warningLevel: 'error',
      reason: 'This location doesn\'t appear to be a business establishment.',
      suggestion: 'Please search for a specific business name that has a Google Business Profile.',
    };
  }

  // Warn if no rating exists (could be new business or not a reviewable business)
  if (placeDetails?.rating == null && placeDetails?.userRatingCount == null) {
    return {
      isValid: true,
      warningLevel: 'warning',
      reason: 'This business doesn\'t have any Google reviews yet.',
      suggestion: 'You can still add it, but customers won\'t see a star rating until you receive your first review.',
    };
  }

  return { isValid: true };
}
