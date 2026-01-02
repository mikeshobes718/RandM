import { NextResponse } from 'next/server';
import { validateBusinessPlace } from '@/lib/googlePlaces';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { placeDetails } = await req.json();
    
    if (!placeDetails) {
      return NextResponse.json({ 
        isValid: false, 
        reason: 'Invalid request',
        warningLevel: 'error'
      });
    }

    const validation = validateBusinessPlace(placeDetails);
    return NextResponse.json(validation);
  } catch (e: any) {
    console.error('[PLACES VALIDATE] Error:', e);
    return NextResponse.json({ 
      isValid: true // Fail open - don't block if validation fails
    });
  }
}



