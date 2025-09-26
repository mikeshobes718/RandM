import { NextResponse } from 'next/server';
import { z } from 'zod';
import { placesAutocomplete } from '@/lib/googlePlaces';

const Body = z.object({
  input: z.string().min(1),
  sessionToken: z.string().min(1),
  includedRegionCodes: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  language: z.string().optional(),
});
type RawSuggestion = {
  placePrediction?: {
    placeId: string;
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let input: string, sessionToken: string, includedRegionCodes: string | undefined, lat: number | undefined, lng: number | undefined, language: string | undefined;
  try {
    ({ input, sessionToken, includedRegionCodes, lat, lng, language } = Body.parse(await req.json()));
  } catch (e) {
    return new NextResponse('Invalid request body', { status: 400 });
  }

  // Infer country via headers (CloudFront/Cloudflare/Vercel) as a default
  const hdrsObj: Record<string,string> = {};
  try {
    (req.headers as Headers).forEach((v, k) => { hdrsObj[k.toLowerCase()] = String(v); });
  } catch {
    const keys = ['cloudfront-viewer-country','cf-ipcountry','x-vercel-ip-country'];
    for (const k of keys) { const v = (req.headers.get(k) || ''); if (v) hdrsObj[k] = v; }
  }
  const headerCountry = (hdrsObj['cloudfront-viewer-country'] || hdrsObj['cf-ipcountry'] || hdrsObj['x-vercel-ip-country'] || '').toUpperCase();
  // Reuse region_hint cookie when available
  const cookieHeader = req.headers.get('cookie') || '';
  let cookieCountry = '';
  try {
    const parts = cookieHeader.split(';').map(s=>s.trim());
    for (const p of parts) {
      if (p.toLowerCase().startsWith('region_hint=')) {
        cookieCountry = decodeURIComponent(p.split('=')[1] || '').toUpperCase();
        break;
      }
    }
  } catch {}

  // Heuristic: if the input mentions a country, bias the search to that region; otherwise let API decide.
  const lc = input.toLowerCase();
  const countryHints: Record<string, string> = {
    colombia: 'CO',
    usa: 'US',
    'united states': 'US',
    canada: 'CA',
    mexico: 'MX',
    spain: 'ES',
    uk: 'GB',
    'united kingdom': 'GB',
  };
  let inferred: string | undefined;
  for (const [k, v] of Object.entries(countryHints)) {
    if (lc.includes(k)) { inferred = v; break; }
  }

  const regions = includedRegionCodes
    ? includedRegionCodes.split(',').map((s) => s.trim()).filter(Boolean)
    : (inferred ? [inferred]
      : (cookieCountry ? [cookieCountry]
        : (headerCountry ? [headerCountry] : undefined)));

  let data: { suggestions?: RawSuggestion[] } = { suggestions: [] };
  try {
    data = await placesAutocomplete(
      input,
      sessionToken,
      regions,
      language,
      lat && lng ? { lat, lng, radiusMeters: 50000 } : undefined
    );
  } catch (e) {
    // Fallback: retry without any hints if Google rejects pattern or inputs
    try {
      data = await placesAutocomplete(input, sessionToken);
    } catch (e2) {
      // Final fallback: return empty list with 200 so UI does not show hard error
      console.error('places autocomplete failed', e2);
      return NextResponse.json({ items: [] }, { status: 200 });
    }
  }
  const items = (data.suggestions ?? [])
    .filter((s: RawSuggestion) => Boolean(s.placePrediction))
    .map((s: RawSuggestion) => ({
      placeId: s.placePrediction!.placeId,
      mainText: s.placePrediction!.structuredFormat?.mainText?.text ?? '',
      secondaryText: s.placePrediction!.structuredFormat?.secondaryText?.text ?? '',
    }));

  const res = NextResponse.json({ items });
  // Cache the detected country to help subsequent requests when header is unavailable
  if (!includedRegionCodes && headerCountry) {
    res.headers.set('Set-Cookie', `region_hint=${headerCountry}; Path=/; Max-Age=1800; SameSite=Lax`);
  }
  return res;
}
