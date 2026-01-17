import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { readSheet } from '@/lib/googleSheets';
import { format, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();

  try {
    const now = new Date();
    const todayFormatted = format(now, 'yyyy-MM-dd', { timeZone: 'America/New_York' });
    const firstOfMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd', { timeZone: 'America/New_York' });

    // 1. Read ALL data from Google Sheet (primary source of truth)
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    let sheetCalls: any[] = [];
    let headers: string[] = [];

    if (spreadsheetId) {
      try {
        const sheetData = await readSheet(spreadsheetId, 'Sheet1!A:P');
        if (sheetData && sheetData.length > 1) {
          headers = sheetData[0];
          sheetCalls = sheetData.slice(1);
        }
      } catch (err) {
        console.error('[ADMIN LEADS] Error reading Google Sheet:', err);
      }
    }

    // 2. Calculate per-rep metrics from Google Sheet
    const repStats: Record<string, { 
      calls_today: number; 
      appointments_today: number; 
      closes_this_month: number; 
      email: string; 
      name: string 
    }> = {};

    let totalCallsToday = 0;
    let totalAppointmentsToday = 0;
    let totalClosesMonth = 0;

    sheetCalls.forEach(row => {
      const date = row[headers.indexOf('Date')] || '';
      const repEmail = row[headers.indexOf('Rep Email')] || '';
      const repId = row[headers.indexOf('Rep ID')] || '';
      const outcome = (row[headers.indexOf('Outcome')] || '').toLowerCase();

      const repKey = repEmail || repId || 'unknown';
      
      if (repKey !== 'unknown') {
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
        if (date === todayFormatted) {
          repStats[repKey].calls_today++;
          totalCallsToday++;

          if (outcome === 'appointment' || outcome === 'callback') {
            repStats[repKey].appointments_today++;
            totalAppointmentsToday++;
          }
        }

        // This month's closes
        if (date >= firstOfMonth && outcome === 'closed') {
          repStats[repKey].closes_this_month++;
          totalClosesMonth++;
        }
      }
    });

    // Convert rep stats to array
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

    // 3. Build leads list from Google Sheet data (deduplicate by business name + phone)
    const leadMap: Record<string, any> = {};
    
    sheetCalls.forEach((row, idx) => {
      const businessName = row[headers.indexOf('Business Name')] || '';
      const phone = row[headers.indexOf('Phone')] || '';
      const address = row[headers.indexOf('Street Address')] || '';
      const city = row[headers.indexOf('City')] || '';
      const state = row[headers.indexOf('State')] || '';
      const rating = row[headers.indexOf('Rating')] || '';
      const timesCalled = parseInt(row[headers.indexOf('Times Called')] || '1', 10);
      const outcome = row[headers.indexOf('Outcome')] || '';
      const date = row[headers.indexOf('Date')] || '';
      const repEmail = row[headers.indexOf('Rep Email')] || '';
      const repId = row[headers.indexOf('Rep ID')] || '';
      const googlePlaceId = row[headers.indexOf('Google Place ID')] || '';

      const key = googlePlaceId || `${businessName}-${phone}`;
      
      if (key && businessName) {
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
          // Update with more recent data
          if (date > leadMap[key].last_called_at) {
            leadMap[key].status = outcome ? outcome.replace(/_/g, ' ') : leadMap[key].status;
            leadMap[key].last_called_at = date;
            leadMap[key].assigned_to_name = repEmail || repId || leadMap[key].assigned_to_name;
          }
          // Keep highest times_called
          if (timesCalled > leadMap[key].times_called) {
            leadMap[key].times_called = timesCalled;
          }
        }
      }
    });

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
