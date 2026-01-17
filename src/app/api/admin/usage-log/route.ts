import { NextResponse } from 'next/server';
import { readSheetData } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const spreadsheetId = '1WMK5Y71w_j0EeYcYwA-7q_S8N3Zib-lZ3maQEgyKu2c';
    
    if (!spreadsheetId) {
      console.error('[USAGE LOG API] GOOGLE_SHEETS_USAGE_ID not set.');
      return NextResponse.json({ logs: [] });
    }

    const sheetData = await readSheetData(spreadsheetId, 'Detailed Hit Log!A:J');
    
    if (sheetData.length <= 1) {
      return NextResponse.json({ logs: [] });
    }

    const headers = sheetData[0];
    const rows = sheetData.slice(1);

    // Map headers to indices
    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => headerMap[h] = i);

    const formattedLogs = rows.map((row, index) => ({
      id: `log-${index}`,
      date: row[headerMap['Date']] || '',
      time: row[headerMap['Time (EST)']] || '',
      transactionId: row[headerMap['Transaction ID']] || '',
      businessName: row[headerMap['Business Name']] || '',
      placeId: row[headerMap['Place ID']] || '',
      action: row[headerMap['Action']] || '',
      cost: row[headerMap['Cost ($)']] || '',
      source: row[headerMap['Source']] || '',
      repId: row[headerMap['Rep ID']] || '',
      repEmail: row[headerMap['Rep Email']] || '',
    }));

    // Sort by date/time (newest first)
    formattedLogs.reverse();

    return NextResponse.json({ logs: formattedLogs });
  } catch (err: any) {
    console.error('[USAGE LOG API] Error:', err);
    return NextResponse.json({ error: err.message, logs: [] }, { status: 500 });
  }
}
