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
    let sheetLeadName = leadData?.name;
    let sheetPhone = leadData?.phone;
    let sheetCity = leadData?.city;
    let sheetState = leadData?.state;
    let sheetRating = leadData?.rating;

    if (!sheetLeadName && targetLeadId) {
      const { data: dbLead } = await supa
        .from('leads')
        .select('name, phone, city, state, rating')
        .eq('id', targetLeadId)
        .single();
      
      if (dbLead) {
        sheetLeadName = dbLead.name;
        sheetPhone = dbLead.phone;
        sheetCity = dbLead.city;
        sheetState = dbLead.state;
        sheetRating = dbLead.rating;
      }
    }

    // 4. APPEND TO GOOGLE SHEET (DO THIS FIRST)
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (spreadsheetId) {
      try {
        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        const rowValues = [
          timestamp,
          sheetLeadName || 'Unknown',
          sheetPhone || 'N/A',
          sheetCity || '',
          sheetState || '',
          sheetRating || '',
          outcome,
          notes || '',
          followupDate || '',
          repEmail || repId || 'system'
        ];

        await appendToSheet(spreadsheetId, 'Sheet1!A1', rowValues);
        console.log('[LOG CALL API] Successfully recorded to Google Sheet first');
      } catch (sheetErr) {
        console.error('[LOG CALL API] Critical Error recording to Google Sheet:', sheetErr);
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
