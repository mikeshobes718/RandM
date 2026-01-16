import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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

    // 2. Fetch rep details for logging (BE SMART HERE)
    let repEmail = null;
    let repUuid = null;
    
    if (repId) {
      // Try to find user by static rep_id OR by uid itself
      // Use proper Supabase filter syntax
      const { data: userData, error: userError } = await supa
        .from('users')
        .select('uid, email')
        .or(`rep_id.eq.${repId},uid.eq.${repId}`)
        .maybeSingle();
      
      if (userError) {
        console.error('[LOG CALL API] User lookup failed:', userError);
      }

      if (userData) {
        repUuid = userData.uid;
        repEmail = userData.email;
      } else {
        console.warn('[LOG CALL API] No user found for repId:', repId);
      }
    } else {
      console.warn('[LOG CALL API] No repId provided in request');
    }

    // 3. Create call log entry
    const { error: logError } = await supa.from('call_log').insert({
      lead_id: targetLeadId,
      rep_id: repUuid || repId || 'system', // Fallback to the raw ID if we couldn't resolve it
      outcome,
      notes,
      followup_date: followupDate || null,
    });

    if (logError) {
      console.error('[LOG CALL API] Call log insertion failed:', logError);
    }

    // 4. Update lead status and stats
    const { data: lead } = await supa.from('leads').select('times_called').eq('id', targetLeadId).single();
    const newTimesCalled = (lead?.times_called || 0) + 1;

    const updatePayload: any = {
      times_called: newTimesCalled,
      last_called_at: new Date().toISOString(),
      last_called_by: repUuid,
      call_status: outcome,
      next_followup: followupDate || null,
      notes: notes,
    };

    // Only add this if it exists in the schema cache (avoid error)
    if (repEmail) {
      updatePayload.last_called_by_email = repEmail;
    }

    const { error: updateError } = await supa
      .from('leads')
      .update(updatePayload)
      .eq('id', targetLeadId);

    if (updateError) {
      console.error('[LOG CALL API] Lead update failed:', updateError);
      
      // If it failed because of the schema cache, try to notify and retry once WITHOUT the email column
      if (updateError.message.includes('column') || updateError.message.includes('schema cache')) {
        console.log('[LOG CALL API] Schema mismatch detected. Retrying without last_called_by_email...');
        
        delete updatePayload.last_called_by_email;
        const { error: retryError } = await supa
          .from('leads')
          .update(updatePayload)
          .eq('id', targetLeadId);
        
        if (retryError) throw retryError;
      } else {
        throw updateError;
      }
    }

    return NextResponse.json({ success: true, leadId: targetLeadId });
  } catch (error: any) {
    console.error('[LOG CALL API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
