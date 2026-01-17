import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { appendToSheet } from '@/lib/googleSheets';

export async function POST(req: Request) {
  const supa = getSupabaseAdmin();
  try {
    const body = await req.json();
    const { leadId, googlePlaceId, leadData, repId, outcome, notes, followupDate } = body;

    let targetLeadId = leadId;

    // 1. If leadId is missing, try to find or create the lead in the DB
    if (!targetLeadId && googlePlaceId) {
      const { data: existingLead } = await supa
        .from('leads')
        .select('id')
        .eq('google_place_id', googlePlaceId)
        .single();

      if (existingLead) {
        targetLeadId = existingLead.id;
      } else if (leadData) {
        const { data: newLead, error: createError } = await supa
          .from('leads')
          .insert({
            google_place_id: googlePlaceId,
            name: leadData.name,
            address: leadData.address,
            rating: leadData.rating,
            business_type: leadData.type,
            phone: leadData.phone,
            google_maps_url: leadData.googleMapsUrl,
            website: leadData.website,
          })
          .select()
          .single();

        if (createError) {
          console.error('[LOG CALL API] Failed to create lead:', createError);
          throw createError;
        }
        targetLeadId = newLead.id;
      }
    }

    if (!targetLeadId) {
      return NextResponse.json({ error: 'Missing lead identification' }, { status: 400 });
    }

    // 2. Resolve Rep Details
    let repEmail = null;
    let repUuid = null;
    
    if (repId) {
      const { data: userData } = await supa
        .from('users')
        .select('uid, email')
        .or(`rep_id.eq.${repId},uid.eq.${repId}`)
        .maybeSingle();
      
      if (userData) {
        repUuid = userData.uid;
        repEmail = userData.email;
      }
    }

    // 3. Resolve Lead Details for Google Sheets (Priority #1)
    // Fetch comprehensive lead data from DB
    let dbLeadData: any = null;
    if (targetLeadId) {
      const { data: dbLead } = await supa
        .from('leads')
        .select('*')
        .eq('id', targetLeadId)
        .single();
      dbLeadData = dbLead;
    }

    // Merge leadData (from frontend) with dbLeadData (from DB)
    const sheetLeadName = leadData?.name || dbLeadData?.name || '';
    const sheetPhone = leadData?.phone || dbLeadData?.phone || '';
    const sheetRating = leadData?.rating || dbLeadData?.rating || '';
    const fullAddress = leadData?.address || dbLeadData?.address || '';
    const sheetWebsite = leadData?.website || dbLeadData?.website || '';
    const sheetPlaceId = googlePlaceId || dbLeadData?.google_place_id || '';
    const sheetCategory = leadData?.type || dbLeadData?.business_type || '';
    const timesCalled = (dbLeadData?.times_called || 0) + 1; // +1 for this call
    
    // Parse address into street, city, state (format: "123 Main St, City, ST 12345, Country")
    let sheetStreetAddress = '';
    let sheetCity = leadData?.city || dbLeadData?.city || '';
    let sheetState = leadData?.state || dbLeadData?.state || '';
    
    if (fullAddress) {
      const parts = fullAddress.split(',').map((p: string) => p.trim());
      if (parts.length >= 3) {
        // First part is usually street address
        sheetStreetAddress = parts[0];
        // Second part is city
        if (!sheetCity && parts[1]) sheetCity = parts[1];
        // Third part usually has state and zip (e.g., "NY 10032")
        if (!sheetState && parts[2]) {
          const stateMatch = parts[2].match(/^([A-Z]{2})/);
          if (stateMatch) sheetState = stateMatch[1];
        }
      } else {
        // Fallback: use full address as street
        sheetStreetAddress = fullAddress;
      }
    }
    
    console.log('[LOG CALL API] Parsed address:', { street: sheetStreetAddress, city: sheetCity, state: sheetState, website: sheetWebsite });

    // Just pass the raw phone number - user will format in Google Sheets
    // Only add +1 prefix if it's a 10-digit US number without country code
    let formattedPhone = sheetPhone || '';
    if (formattedPhone) {
      const cleanPhone = formattedPhone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        formattedPhone = '+1' + cleanPhone; // Simple format: +15161234567
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
        formattedPhone = '+' + cleanPhone; // Already has country code
      }
      // Otherwise keep as-is
    }

    // Get rep_id from users table (the static ID assigned by admin)
    let staticRepId = '';
    if (repId) {
      const { data: repData } = await supa
        .from('users')
        .select('rep_id')
        .or(`rep_id.eq.${repId},uid.eq.${repId}`)
        .maybeSingle();
      staticRepId = repData?.rep_id || '';
    }

    // 4. APPEND TO GOOGLE SHEET (DO THIS FIRST)
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    console.log('[LOG CALL API] Google Sheets ID:', spreadsheetId ? 'SET ✅' : 'MISSING ❌');
    
    if (!spreadsheetId) {
      console.error('[LOG CALL API] GOOGLE_SHEETS_ID environment variable is not set!');
    } else {
      try {
        // Create date and time in separate columns with EST label
        const now = new Date();
        const dateOptions: Intl.DateTimeFormatOptions = { 
          timeZone: 'America/New_York', 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        };
        const timeOptions: Intl.DateTimeFormatOptions = { 
          timeZone: 'America/New_York', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true
        };
        
        const dateStr = now.toLocaleDateString('en-US', dateOptions);
        const timeStr = now.toLocaleTimeString('en-US', timeOptions) + ' EST';
        
        // Clean outcome - if blank or no_answer type, leave empty
        const cleanOutcome = outcome && outcome !== 'no_answer' ? outcome : '';

        // Row structure (17 columns):
        // Date | Time | Business Name | Phone | Street Address | City | State | Rating | 
        // Google Place ID | Website | Times Called | Outcome | Notes | Follow-up | Rep Email | Rep ID | Category
        const rowValues = [
          dateStr,                           // A: Date
          timeStr,                           // B: Time (EST)
          sheetLeadName,                     // C: Business Name
          formattedPhone,                    // D: Phone (with country code)
          sheetStreetAddress,                // E: Street Address (parsed from full address)
          sheetCity,                         // F: City
          sheetState,                        // G: State
          sheetRating?.toString() || '',     // H: Rating
          sheetPlaceId,                      // I: Google Place ID
          sheetWebsite,                      // J: Website
          timesCalled.toString(),            // K: Times Called
          cleanOutcome,                      // L: Outcome (blank if no_answer)
          notes || '',                       // M: Notes
          followupDate || '',                // N: Follow-up Date
          repEmail || '',                    // O: Rep Email
          staticRepId,                       // P: Rep ID
          sheetCategory,                     // Q: Category (business type)
        ];

        console.log('[LOG CALL API] Attempting to append to Google Sheet...', rowValues);
        await appendToSheet(spreadsheetId, 'Sheet1!A1', rowValues);
        console.log('[LOG CALL API] ✅ Successfully recorded to Google Sheet first');
      } catch (sheetErr: any) {
        console.error('[LOG CALL API] ❌ Critical Error recording to Google Sheet:', sheetErr);
        console.error('[LOG CALL API] Error details:', sheetErr.message);
        console.error('[LOG CALL API] Error stack:', sheetErr.stack);
        // We continue anyway, but we've logged the error
      }
    }

    // 5. Create call log entry in DB
    const { error: logError } = await supa.from('call_log').insert({
      lead_id: targetLeadId,
      rep_id: repUuid || repId || 'system',
      outcome,
      notes,
      followup_date: followupDate || null,
    });

    if (logError) {
      console.error('[LOG CALL API] Call log insertion failed:', logError);
    }

    // 6. Update lead status and stats in DB
    const { data: lead } = await supa.from('leads').select('times_called').eq('id', targetLeadId).single();
    const newTimesCalled = (lead?.times_called || 0) + 1;

    const updatePayload: any = {
      times_called: newTimesCalled,
      last_called_at: new Date().toISOString(),
      last_called_by: repUuid,
      call_status: outcome,
      next_followup: followupDate || null,
    };

    if (repEmail) {
      updatePayload.last_called_by_email = repEmail;
    }

    const { error: updateError } = await supa
      .from('leads')
      .update(updatePayload)
      .eq('id', targetLeadId);

    if (updateError) {
      console.error('[LOG CALL API] Lead update failed:', updateError);
      
      if (updateError.message.includes('column') || updateError.message.includes('schema cache')) {
        const minimalPayload = {
          times_called: newTimesCalled,
          last_called_at: new Date().toISOString(),
          call_status: outcome,
        };
        await supa.from('leads').update(minimalPayload).eq('id', targetLeadId);
      }
    }

    return NextResponse.json({ success: true, leadId: targetLeadId });
  } catch (error: any) {
    console.error('[LOG CALL API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
