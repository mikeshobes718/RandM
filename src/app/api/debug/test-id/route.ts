import { NextRequest, NextResponse } from 'next/server';
import { getPlaceDetails } from '@/lib/googlePlaces';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing id' });

  try {
    const details = await getPlaceDetails(id);
    return NextResponse.json(details);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}

