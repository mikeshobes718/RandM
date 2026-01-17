import { NextResponse } from 'next/server';
import { readSheetData } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    if (!spreadsheetId) {
      console.error('[LEADERBOARD] GOOGLE_SHEETS_ID not set');
      return NextResponse.json({ leaderboard: [], total_active: 0 });
    }

    // Read all data from Google Sheet
    const rows = await readSheetData(spreadsheetId, 'Sheet1!A:P');
    
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ leaderboard: [], total_active: 0 });
    }

    // Get today's date in MM/DD/YYYY format (matching the sheet format)
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-US', { 
      timeZone: 'America/New_York',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });

    // Column indices (0-based):
    // A(0): Date, B(1): Time, C(2): Business Name, D(3): Phone, E(4): Street Address,
    // F(5): City, G(6): State, H(7): Rating, I(8): Google Place ID, J(9): Website,
    // K(10): Times Called, L(11): Outcome, M(12): Notes, N(13): Follow-up Date,
    // O(14): Rep Email, P(15): Rep ID
    
    const DATE_COL = 0;
    const OUTCOME_COL = 11;
    const REP_EMAIL_COL = 14;
    const REP_ID_COL = 15;

    // Skip header row, filter for today's calls
    const todaysCalls = rows.slice(1).filter(row => {
      const rowDate = row[DATE_COL];
      return rowDate === todayStr;
    });

    // Group by Rep Email/Rep ID
    const statsByRep: Record<string, { 
      email: string, 
      repId: string, 
      name: string, 
      calls: number, 
      closes: number,
      appointments: number
    }> = {};

    todaysCalls.forEach(row => {
      const repEmail = row[REP_EMAIL_COL] || '';
      const repId = row[REP_ID_COL] || '';
      const outcome = (row[OUTCOME_COL] || '').toLowerCase();
      
      // Use repId as key if available, otherwise email
      const key = repId || repEmail || 'unknown';
      
      if (!statsByRep[key]) {
        statsByRep[key] = {
          email: repEmail,
          repId: repId,
          name: repId || repEmail.split('@')[0] || 'Unknown',
          calls: 0,
          closes: 0,
          appointments: 0
        };
      }

      statsByRep[key].calls++;
      
      if (outcome === 'closed' || outcome === 'close') {
        statsByRep[key].closes++;
      }
      if (outcome === 'appointment') {
        statsByRep[key].appointments++;
      }
    });

    // Sort by closes first, then appointments, then calls
    const leaderStats = Object.values(statsByRep)
      .filter(s => s.calls > 0)
      .sort((a, b) => {
        if (b.closes !== a.closes) return b.closes - a.closes;
        if (b.appointments !== a.appointments) return b.appointments - a.appointments;
        return b.calls - a.calls;
      });

    return NextResponse.json({ 
      leaderboard: leaderStats.slice(0, 10), // Top 10
      total_active: leaderStats.length,
      date: todayStr,
      total_calls_today: todaysCalls.length
    });
  } catch (error: any) {
    console.error('[LEADERBOARD API] Error:', error);
    return NextResponse.json({ leaderboard: [], total_active: 0, error: error.message });
  }
}
