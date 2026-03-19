import { NextResponse } from 'next/server';
import { readSheet } from '@/lib/googleSheets';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();
  
  try {
    // Use EST timezone for consistency with Google Sheets dates
    const now = new Date();
    const estOptions = { timeZone: 'America/New_York' };
    const todayFormatted = now.toLocaleDateString('en-US', estOptions); // e.g., "1/17/2026"
    
    console.log('[ADMIN LEADS] Today formatted (EST):', todayFormatted);

    // 0. Get ALL sales reps from database (so we show everyone, even with 0 calls)
    const { data: allSalesReps } = await supa
      .from('users')
      .select('uid, email, rep_id')
      .eq('role', 'sales_rep');
    
    console.log('[ADMIN LEADS] All sales reps from DB:', allSalesReps?.length || 0);

    // 1. Read ALL data from Google Sheet (primary source of truth for calls)
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    let sheetCalls: any[] = [];
    let headers: string[] = [];

    if (spreadsheetId) {
      try {
        const sheetData = await readSheet(spreadsheetId, 'Sheet1!A:Q'); // Extended to column Q for Category
        if (sheetData && sheetData.length > 1) {
          headers = sheetData[0];
          sheetCalls = sheetData.slice(1);
        }
      } catch (err) {
        console.error('[ADMIN LEADS] Error reading Google Sheet:', err);
      }
    }

    // 2. Initialize ALL sales reps with 0 metrics (so everyone shows up)
    const repStats: Record<string, { 
      calls_today: number; 
      appointments_today: number; 
      closes_this_month: number; 
      email: string; 
      name: string 
    }> = {};

    // Pre-populate with ALL sales reps from database
    (allSalesReps || []).forEach(rep => {
      const repKey = rep.email?.toLowerCase() || rep.uid;
      repStats[repKey] = {
        calls_today: 0,
        appointments_today: 0,
        closes_this_month: 0,
        email: rep.email || '',
        name: rep.rep_id || rep.email?.split('@')[0] || 'Unknown'
      };
    });

    let totalCallsToday = 0;
    let totalAppointmentsToday = 0;
    let totalClosesMonth = 0;

    // Helper to normalize date format (remove leading zeros)
    const normalizeDate = (d: string) => {
      const parts = d.split('/');
      if (parts.length === 3) {
        return `${parseInt(parts[0])}/${parseInt(parts[1])}/${parts[2]}`;
      }
      return d;
    };

    // Log first few rows for debugging
    if (sheetCalls.length > 0) {
      console.log('[ADMIN LEADS] Headers:', headers);
      console.log('[ADMIN LEADS] First row date:', sheetCalls[0][headers.indexOf('Date')]);
    }

    // Process sheet calls and update rep stats
    sheetCalls.forEach(row => {
      const date = row[headers.indexOf('Date')] || '';
      const repEmail = (row[headers.indexOf('Rep Email')] || '').toLowerCase();
      const repId = row[headers.indexOf('Rep ID')] || '';
      const outcome = (row[headers.indexOf('Outcome')] || '').toLowerCase();

      const repKey = repEmail || repId || 'unknown';
      
      // If this rep exists in our stats (from DB or seen in sheet)
      if (repKey !== 'unknown') {
        // Add rep if not already in stats (could be someone who logged before being added to DB)
        if (!repStats[repKey]) {
          repStats[repKey] = {
            calls_today: 0,
            appointments_today: 0,
            closes_this_month: 0,
            email: repEmail,
            name: repEmail ? repEmail.split('@')[0] : repId
          };
        }

        // Today's calls
        const isToday = normalizeDate(date) === todayFormatted;
        if (isToday) {
          repStats[repKey].calls_today++;
          totalCallsToday++;

          if (outcome === 'appointment' || outcome === 'callback') {
            repStats[repKey].appointments_today++;
            totalAppointmentsToday++;
          }
        }

        // This month's closes
        if (outcome === 'closed' || outcome === 'close') {
          try {
            const callDate = new Date(date);
            if (!isNaN(callDate.getTime()) && 
                callDate.getMonth() === now.getMonth() && 
                callDate.getFullYear() === now.getFullYear()) {
              repStats[repKey].closes_this_month++;
              totalClosesMonth++;
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
      }
    });

    // Convert rep stats to array - includes ALL reps even those with 0 calls
    const repMetrics = Object.values(repStats)
      .filter(r => r.email || r.name)
      .map(r => ({
        rep_name: r.name,
        rep_email: r.email,
        calls_today: r.calls_today,
        appointments_today: r.appointments_today,
        closes_this_month: r.closes_this_month
      }))
      .sort((a, b) => b.closes_this_month - a.closes_this_month || b.calls_today - a.calls_today);

    // 3. Build leads list from Google Sheet data (deduplicate by Google Place ID or Business Name)
    const leadMap: Record<string, any> = {};
    
    console.log('[ADMIN LEADS] Processing', sheetCalls.length, 'rows from Google Sheet');
    
    sheetCalls.forEach((row, idx) => {
      const businessName = (row[headers.indexOf('Business Name')] || '').trim();
      const phone = (row[headers.indexOf('Phone')] || '').trim();
      const address = (row[headers.indexOf('Street Address')] || '').trim();
      const city = (row[headers.indexOf('City')] || '').trim();
      const state = (row[headers.indexOf('State')] || '').trim();
      const rating = row[headers.indexOf('Rating')] || '';
      const timesCalled = parseInt(row[headers.indexOf('Times Called')] || '1', 10);
      const outcome = (row[headers.indexOf('Outcome')] || '').trim();
      const date = (row[headers.indexOf('Date')] || '').trim();
      const repEmail = (row[headers.indexOf('Rep Email')] || '').trim();
      const repId = (row[headers.indexOf('Rep ID')] || '').trim();
      const googlePlaceId = (row[headers.indexOf('Google Place ID')] || '').trim();

      // Primary key: Google Place ID, fallback: business name (case-insensitive)
      const key = googlePlaceId || businessName.toLowerCase();
      
      // Only skip if there's no business name at all
      if (!businessName) {
        console.log('[ADMIN LEADS] Skipping row', idx, '- no business name');
        return;
      }
      
      if (!leadMap[key]) {
        leadMap[key] = {
          id: `sheet-lead-${idx}`,
          name: businessName,
          phone: phone,
          address: address,
          city: city,
          state: state,
          rating: rating,
          times_called: timesCalled,
          status: outcome ? outcome.replace(/_/g, ' ') : 'fresh',
          last_called_at: date,
          assigned_to_name: repEmail || repId || 'Unassigned',
          google_place_id: googlePlaceId
        };
      } else {
        // Update with more recent data (compare dates)
        const existingDate = leadMap[key].last_called_at || '';
        if (date && date > existingDate) {
          leadMap[key].status = outcome ? outcome.replace(/_/g, ' ') : leadMap[key].status;
          leadMap[key].last_called_at = date;
          leadMap[key].assigned_to_name = repEmail || repId || leadMap[key].assigned_to_name;
        }
        // Keep highest times_called (represents most recent call count)
        if (timesCalled > leadMap[key].times_called) {
          leadMap[key].times_called = timesCalled;
        }
        // Update phone if we didn't have one
        if (!leadMap[key].phone && phone) {
          leadMap[key].phone = phone;
        }
      }
    });

    console.log('[ADMIN LEADS] Built', Object.keys(leadMap).length, 'unique leads');

    const formattedLeads = Object.values(leadMap)
      .sort((a, b) => (b.last_called_at || '').localeCompare(a.last_called_at || ''));

    const totalMetrics = {
      callsToday: totalCallsToday,
      appointments: totalAppointmentsToday,
      closesThisMonth: totalClosesMonth,
    };

    console.log('[ADMIN LEADS] From Google Sheet - Totals:', totalMetrics, 'Reps:', repMetrics.length, 'Leads:', formattedLeads.length);

    return NextResponse.json({ 
      leads: formattedLeads,
      repMetrics,
      totalMetrics,
      source: 'google_sheets'
    });
  } catch (err: any) {
    console.error('Admin Leads API error:', err);
    return NextResponse.json({ 
      error: err.message, 
      leads: [], 
      repMetrics: [], 
      totalMetrics: { callsToday: 0, appointments: 0, closesThisMonth: 0 } 
    }, { status: 500 });
  }
}
