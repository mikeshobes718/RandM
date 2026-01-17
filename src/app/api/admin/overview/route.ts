import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { readSheetData } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();

  // Default values if tables don't exist
  const defaults = {
    mrr: 0, activeCustomers: 0, activeReps: 0, closesThisWeek: 0, commissionsOwed: 0,
    callsToday: 0, callsThisWeek: 0, totalCalls: 0, totalCloses: 0, repActivity: [],
    recentActivity: []
  };

  try {
    // 1. MRR from subscriptions (from database)
    const { data: subs } = await supa.from('subscriptions').select('plan_id').eq('status', 'active');
    const mrr = (subs || []).reduce((sum, s) => {
      if (s.plan_id === 'unlimited') return sum + 199;
      if (s.plan_id === 'pro') return sum + 99;
      return sum + 49;
    }, 0);

    // 2. Active Customers (count users with role='customer')
    const { count: customerCount } = await supa.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer');
    const activeCustomers = customerCount || 0;

    // 3. Active Reps (from database)
    let activeReps = 0;
    const { count: repsCount, error: repsErr } = await supa.from('users').select('*', { count: 'exact', head: true }).eq('role', 'sales_rep');
    if (!repsErr) activeReps = repsCount || 0;

    // 4-8. Call Metrics from Google Sheets
    let callsToday = 0, callsThisWeek = 0, totalCalls = 0, totalCloses = 0, closesThisWeek = 0;
    const activity: any[] = [];

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    if (spreadsheetId) {
      const rows = await readSheetData(spreadsheetId, 'Sheet1!A:Q'); // A-Q covers all 17 columns
      
      if (rows && rows.length > 1) {
        const dataRows = rows.slice(1); // Skip header
        totalCalls = dataRows.length;

        // Get today's date and week ago in MM/DD/YYYY format
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-US', { 
          timeZone: 'America/New_York',
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
        
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Column indices
        const DATE_COL = 0;
        const TIME_COL = 1;
        const NAME_COL = 2;
        const OUTCOME_COL = 11;
        const REP_EMAIL_COL = 14;
        const REP_ID_COL = 15;

        dataRows.forEach(row => {
          const rowDate = row[DATE_COL];
          const outcome = (row[OUTCOME_COL] || '').toLowerCase();
          
          // Check if closed
          if (outcome === 'closed' || outcome === 'close') {
            totalCloses++;
          }

          // Parse date
          if (rowDate) {
            const [month, day, year] = rowDate.split('/').map(Number);
            const rowDateObj = new Date(year, month - 1, day);
            
            // Today's calls
            if (rowDate === todayStr) {
              callsToday++;
            }
            
            // This week's calls
            if (rowDateObj >= weekAgo) {
              callsThisWeek++;
              if (outcome === 'closed' || outcome === 'close') {
                closesThisWeek++;
              }
            }
          }
        });

        // Recent Activity (last 15 calls, most recent first)
        const recentRows = dataRows.slice(-15).reverse();
        recentRows.forEach(row => {
          const date = row[DATE_COL] || '';
          const time = row[TIME_COL] || '';
          const name = row[NAME_COL] || 'Unknown Business';
          const outcome = row[OUTCOME_COL] || '';
          const repId = row[REP_ID_COL] || row[REP_EMAIL_COL] || 'System';

          activity.push({
            time: `${date} ${time}`.trim(),
            event: `${repId} logged a call: ${outcome.replace(/_/g, ' ') || 'call'}`,
            detail: name,
            type: outcome.toLowerCase() === 'closed' || outcome.toLowerCase() === 'close' ? 'close' : 'log'
          });
        });
      }
    }

    return NextResponse.json({
      mrr,
      activeCustomers: activeCustomers || 0,
      activeReps,
      closesThisWeek,
      commissionsOwed: 0,
      callsToday,
      callsThisWeek,
      totalCalls,
      totalCloses,
      recentActivity: activity.slice(0, 15)
    });
  } catch (err: any) {
    console.error('[ADMIN OVERVIEW API] Error:', err);
    return NextResponse.json({ ...defaults, error: err.message });
  }
}
