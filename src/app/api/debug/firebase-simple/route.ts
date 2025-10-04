import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const env = getEnv();
    const serviceAccountB64 = env.FIREBASE_SERVICE_ACCOUNT_B64;
    
    if (!serviceAccountB64) {
      return NextResponse.json({
        success: false,
        error: 'FIREBASE_SERVICE_ACCOUNT_B64 not found',
        hasServiceAccount: false
      });
    }

    // Try to decode and parse the JSON
    let decoded;
    try {
      decoded = Buffer.from(serviceAccountB64, 'base64').toString('utf-8');
    } catch (decodeError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to decode base64: ' + (decodeError instanceof Error ? decodeError.message : 'Unknown error'),
        hasServiceAccount: true,
        serviceAccountLength: serviceAccountB64.length,
        firstChars: serviceAccountB64.substring(0, 100),
        lastChars: serviceAccountB64.substring(serviceAccountB64.length - 100)
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(decoded);
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse JSON: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'),
        hasServiceAccount: true,
        serviceAccountLength: serviceAccountB64.length,
        decodedLength: decoded.length,
        decodedFirstChars: decoded.substring(0, 200),
        decodedLastChars: decoded.substring(decoded.length - 200)
      });
    }

    return NextResponse.json({
      success: true,
      hasServiceAccount: true,
      serviceAccountLength: serviceAccountB64.length,
      decodedLength: decoded.length,
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      hasPrivateKey: !!parsed.private_key
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64
    });
  }
}














