import { NextRequest, NextResponse } from 'next/server';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Extract and verify the authenticated user's UID from a request.
 * Tries cookie auth first, then Authorization header (Firebase Admin → REST fallback).
 */
export async function resolveUid(req: NextRequest): Promise<string | null> {
  let uid = await requireUid().catch(() => null);

  if (!uid) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (token) {
      try {
        const auth = getAuthAdmin();
        const decoded = await auth.verifyIdToken(token);
        uid = decoded.uid;
      } catch {
        try {
          const verified = await verifyIdTokenViaRest(token);
          uid = verified.uid;
        } catch {
          uid = null;
        }
      }
    }
  }

  return uid;
}

/**
 * Require a valid UID or return a 401 response.
 */
export async function requireAuth(req: NextRequest): Promise<{ uid: string } | NextResponse> {
  const uid = await resolveUid(req);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  return { uid };
}

/**
 * Fetch the business record for a given owner UID.
 * Handles schema fallbacks for columns that may not exist yet.
 */
export async function getBusinessForOwner(uid: string) {
  const supa = getSupabaseAdmin();

  const fullColumns = 'id,name,slug,review_link,google_maps_write_review_uri,google_rating,google_place_id,contact_phone,google_photo_url,address,business_type';

  const { data, error } = await supa
    .from('businesses')
    .select(fullColumns)
    .eq('owner_uid', uid)
    .maybeSingle();

  if (!error) return data;

  if (/column|undefined/.test(error.message || '')) {
    const minColumns = 'id,name,review_link,google_maps_write_review_uri,google_rating,google_place_id,contact_phone';
    const fallback = await supa.from('businesses').select(minColumns).eq('owner_uid', uid).maybeSingle();
    return fallback.data;
  }

  throw new Error(error.message);
}

export function startOfCurrentMonthUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
