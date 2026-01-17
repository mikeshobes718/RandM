import { NextResponse } from 'next/server';
import { readSheetData } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'GOOGLE_SHEETS_ID not set', calls: [] }, { status: 500 });
    }

    // Read all data from Google Sheet
    const rows = await readSheetData(spreadsheetId, 'Sheet1!A:P');
    
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ calls: [] });
    }

    // Column indices (0-based):
    // A(0): Date, B(1): Time, C(2): Business Name, D(3): Phone, E(4): Street Address,
    // F(5): City, G(6): State, H(7): Rating, I(8): Google Place ID, J(9): Website,
    // K(10): Times Called, L(11): Outcome, M(12): Notes, N(13): Follow-up Date,
    // O(14): Rep Email, P(15): Rep ID

    // Skip header row and process all call logs (most recent first)
    const formattedCalls = rows.slice(1).reverse().map((row, index) => {
      const date = row[0] || '';
      const time = row[1] || '';
      const businessName = row[2] || 'Unknown Business';
      const phone = row[3] || '-';
      const outcome = row[11] || '';
      const notes = row[12] || '-';
      const followupDate = row[13] || '';
      const repEmail = row[14] || '';
      const repId = row[15] || '';

      // Combine date and time into timestamp
      let timestamp = '';
      if (date && time) {
        // Remove EST suffix if present
        const cleanTime = time.replace(' EST', '').trim();
        timestamp = `${date} ${cleanTime}`;
      } else if (date) {
        timestamp = date;
      }

      return {
        id: `sheet-${index}`,
        timestamp,
        outcome: outcome ? outcome.replace(/_/g, ' ') : '-',
        notes: notes || '-',
        followup_date: followupDate,
        rep_name: repId || repEmail || 'System',
        lead_name: businessName,
        lead_phone: phone
      };
    });

    return NextResponse.json({ calls: formattedCalls.slice(0, 500) });
  } catch (err: any) {
    console.error('[ADMIN CALLS API] Error:', err);
    return NextResponse.json({ error: err.message, calls: [] }, { status: 500 });
  }
}

