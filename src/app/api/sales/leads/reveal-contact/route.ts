import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getPlaceDetails } from '@/lib/googlePlaces';
import { appendToSheet, readSheetData } from '@/lib/googleSheets';

const USAGE_SPREADSHEET_ID = '1WMK5Y71w_j0EeYcYwA-7q_S8N3Zib-lZ3maQEgyKu2c';

export async function POST(req: Request) {
  const supa = getSupabaseAdmin();
  
  try {
    const { googlePlaceId, leadData, repEmail, repId } = await req.json();

    console.log('[REVEAL CONTACT] Received request for:', googlePlaceId);

    if (!googlePlaceId) {
      return NextResponse.json({ error: 'Missing googlePlaceId' }, { status: 400 });
    }

    // ========================================
    // STEP 1: Check the REVEALS Google Sheet first (Source of Truth)
    // ========================================
    try {
      console.log('[REVEAL CONTACT] Checking Reveals sheet...');
      const revealsData = await readSheetData(USAGE_SPREADSHEET_ID, 'Reveals!A:H');
      
      if (revealsData.length > 1) {
        const headers = revealsData[0];
        const placeIdIndex = headers.indexOf('Place ID');
        const phoneIndex = headers.indexOf('Phone');
        const websiteIndex = headers.indexOf('Website');
        const businessNameIndex = headers.indexOf('Business Name');
        
        // Find existing reveal by Place ID
        for (let i = 1; i < revealsData.length; i++) {
          const row = revealsData[i];
          if (row[placeIdIndex] === googlePlaceId && row[phoneIndex]) {
            console.log('[REVEAL CONTACT] ✅ Found in Reveals sheet:', row[phoneIndex]);
            
            // Log the cached hit to Detailed Hit Log
            try {
              const now = new Date();
              const estDate = now.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
              const estTime = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true }) + ' EST';
              const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              
              await appendToSheet(USAGE_SPREADSHEET_ID, 'Detailed Hit Log!A2', [
                estDate,
                estTime,
                transactionId,
                row[businessNameIndex] || leadData?.name || 'Unknown Business',
                googlePlaceId,
                'Reveal Contact (Cached from Sheet)',
                '$0.00',
                'Reveals Sheet Cache',
                repId || 'N/A',
                repEmail || 'System'
              ]);
            } catch (logErr) {
              console.error('[REVEAL CONTACT] Log error:', logErr);
            }

            return NextResponse.json({ 
              success: true, 
              phone: row[phoneIndex], 
              website: row[websiteIndex] || null,
              source: 'reveals_sheet'
            });
          }
        }
      }
    } catch (sheetErr) {
      console.error('[REVEAL CONTACT] Error reading Reveals sheet:', sheetErr);
      // Continue to check DB if sheet read fails
    }

    // ========================================
    // STEP 2: Check database as fallback
    // ========================================
    const { data: existingLead } = await supa
      .from('leads')
      .select('name, phone, website')
      .eq('google_place_id', googlePlaceId)
      .maybeSingle();

    if (existingLead?.phone) {
      console.log('[REVEAL CONTACT] Found in DB, adding to Reveals sheet:', existingLead.phone);
      
      // Add to Reveals sheet for future lookups
      try {
        const now = new Date();
        const estDate = now.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
        const estTime = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true }) + ' EST';
        
        await appendToSheet(USAGE_SPREADSHEET_ID, 'Reveals!A2', [
          estDate,
          estTime,
          existingLead.name || leadData?.name || 'Unknown Business',
          googlePlaceId,
          existingLead.phone,
          existingLead.website || '',
          repId || 'N/A',
          repEmail || 'System'
        ]);

        // Log to Detailed Hit Log
        const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await appendToSheet(USAGE_SPREADSHEET_ID, 'Detailed Hit Log!A2', [
          estDate,
          estTime,
          transactionId,
          existingLead.name || leadData?.name || 'Unknown Business',
          googlePlaceId,
          'Reveal Contact (DB → Sheet)',
          '$0.00',
          'Database Cache',
          repId || 'N/A',
          repEmail || 'System'
        ]);
      } catch (sheetErr) {
        console.error('[REVEAL CONTACT] Error writing to Reveals sheet:', sheetErr);
      }

      return NextResponse.json({ 
        success: true, 
        phone: existingLead.phone, 
        website: existingLead.website,
        source: 'database'
      });
    }

    // ========================================
    // STEP 3: Fetch from Google Places API (costs $0.025)
    // ========================================
    console.log('[REVEAL CONTACT] Fetching from Google Places API...');
    let details;
    try {
      details = await getPlaceDetails(googlePlaceId);
    } catch (googleErr: any) {
      console.error('[REVEAL CONTACT] Google API error:', googleErr.message);
      return NextResponse.json({ 
        error: `Google Places API error: ${googleErr.message}`,
        suggestion: 'The place ID may be invalid or the API quota may be exceeded.'
      }, { status: 500 });
    }
    
    const phone = details.nationalPhoneNumber || details.internationalPhoneNumber || null;
    const website = details.websiteUri || null;
    const businessName = leadData?.name || details.displayName?.text || 'Unknown Business';

    if (!phone) {
      console.log('[REVEAL CONTACT] No phone found for this business');
      return NextResponse.json({ 
        success: true, 
        phone: null, 
        website,
        message: 'This business has no phone number listed on Google.'
      });
    }

    // ========================================
    // STEP 4: Save to REVEALS sheet (Source of Truth)
    // ========================================
    const now = new Date();
    const estDate = now.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
    const estTime = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true }) + ' EST';
    
    try {
      await appendToSheet(USAGE_SPREADSHEET_ID, 'Reveals!A2', [
        estDate,
        estTime,
        businessName,
        googlePlaceId,
        phone,
        website || '',
        repId || 'N/A',
        repEmail || 'System'
      ]);
      console.log('[REVEAL CONTACT] ✅ Saved to Reveals sheet');
    } catch (sheetErr) {
      console.error('[REVEAL CONTACT] Error saving to Reveals sheet:', sheetErr);
    }

    // ========================================
    // STEP 5: Log to Detailed Hit Log (cost tracking)
    // ========================================
    try {
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await appendToSheet(USAGE_SPREADSHEET_ID, 'Detailed Hit Log!A2', [
        estDate,
        estTime,
        transactionId,
        businessName,
        googlePlaceId,
        'Reveal Contact (NEW)',
        '$0.025',
        'Google Places API',
        repId || 'N/A',
        repEmail || 'System'
      ]);
    } catch (logErr) {
      console.error('[REVEAL CONTACT] Log error:', logErr);
    }

    // ========================================
    // STEP 6: Save to database (backup/search)
    // ========================================
    const fullAddress = leadData?.address || details.formattedAddress;
    let dbCity = leadData?.city || '';
    let dbState = leadData?.state || '';
    
    if (fullAddress && (!dbCity || !dbState)) {
      const parts = fullAddress.split(',').map((p: string) => p.trim());
      if (parts.length >= 3) {
        if (!dbCity) dbCity = parts[parts.length - 3];
        const stateZip = parts[parts.length - 2];
        const stateMatch = stateZip?.match(/^([A-Z]{2})/);
        if (stateMatch && !dbState) dbState = stateMatch[1];
      }
    }

    const { data: lead, error: dbError } = await supa
      .from('leads')
      .upsert({
        google_place_id: googlePlaceId,
        name: businessName,
        address: fullAddress,
        rating: leadData?.rating || details.rating,
        review_count: leadData?.reviewCount || details.userRatingCount,
        business_type: leadData?.type,
        google_maps_url: leadData?.googleMapsUrl || details.googleMapsUri,
        city: dbCity.toLowerCase() || null,
        state: dbState || null,
        phone: phone,
        website: website,
      }, { onConflict: 'google_place_id' })
      .select()
      .single();

    if (dbError) {
      console.error('[REVEAL CONTACT] DB Error:', dbError);
    }

    console.log('[REVEAL CONTACT] ✅ Success! Phone:', phone);
    return NextResponse.json({ 
      success: true, 
      phone, 
      website,
      dbId: lead?.id,
      source: 'google_api'
    });
  } catch (error: any) {
    console.error('[REVEAL CONTACT] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
