import { NextResponse } from 'next/server';
import { readSheetData } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const repId = searchParams.get('repId'); // This is the static REP ID from users table
  const repEmail = searchParams.get('repEmail'); // Also accept email

  const defaults = {
    callsToday: 0,
    appointments: 0,
    closes: 0,
    commissionEarned: 0,
    pendingCommission: 0,
    payoutHistory: [],
    nextPayoutDate: "TBD",
    estimatedNextPayout: 0
  };

  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    if (!spreadsheetId) {
      console.error('[REP STATS] GOOGLE_SHEETS_ID not set');
      return NextResponse.json(defaults);
    }

    // Read all data from Google Sheet
    const rows = await readSheetData(spreadsheetId, 'Sheet1!A:P');
    
    if (!rows || rows.length <= 1) {
      return NextResponse.json(defaults);
    }

    // Get today's date and first of month in MM/DD/YYYY format
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-US', { 
      timeZone: 'America/New_York',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    // First day of current month
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Column indices (0-based)
    const DATE_COL = 0;
    const OUTCOME_COL = 11;
    const REP_EMAIL_COL = 14;
    const REP_ID_COL = 15;

    // Filter for this rep's calls
    const repCalls = rows.slice(1).filter(row => {
      const rowRepId = row[REP_ID_COL] || '';
      const rowRepEmail = row[REP_EMAIL_COL] || '';
      
      // Match by repId or email (case-insensitive)
      if (repId && rowRepId.toLowerCase() === repId.toLowerCase()) return true;
      if (repEmail && rowRepEmail.toLowerCase() === repEmail.toLowerCase()) return true;
      return false;
    });

    // Filter for today's calls
    const todaysCalls = repCalls.filter(row => row[DATE_COL] === todayStr);
    
    // Filter for this month's closes
    const monthCloses = repCalls.filter(row => {
      const rowDate = row[DATE_COL];
      const outcome = (row[OUTCOME_COL] || '').toLowerCase();
      
      // Parse date (MM/DD/YYYY format)
      if (!rowDate) return false;
      const [month, day, year] = rowDate.split('/').map(Number);
      const rowDateObj = new Date(year, month - 1, day);
      
      return rowDateObj >= firstOfMonth && (outcome === 'closed' || outcome === 'close');
    });

    // Count today's appointments
    const todaysAppointments = todaysCalls.filter(row => {
      const outcome = (row[OUTCOME_COL] || '').toLowerCase();
      return outcome === 'appointment';
    });

    return NextResponse.json({
      callsToday: todaysCalls.length,
      appointments: todaysAppointments.length,
      closes: monthCloses.length,
      commissionEarned: 0, // Would need a separate commissions sheet
      pendingCommission: 0,
      payoutHistory: [],
      nextPayoutDate: "TBD",
      estimatedNextPayout: 0
    });
  } catch (error: any) {
    console.error('[REP STATS API] Error:', error);
    return NextResponse.json(defaults);
  }
}
