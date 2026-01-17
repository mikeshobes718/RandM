import { NextResponse } from 'next/server';
import { appendToSheet } from '@/lib/googleSheets';

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    if (!spreadsheetId) {
      return NextResponse.json({ 
        error: 'GOOGLE_SHEETS_ID not set',
        env: process.env.GOOGLE_SHEETS_ID 
      }, { status: 500 });
    }

    const testRow = [
      new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      'TEST Business',
      '555-1234',
      'Test City',
      'NY',
      '4.5',
      'test',
      'This is a test call log',
      '',
      'test@example.com'
    ];

    await appendToSheet(spreadsheetId, 'Sheet1!A1', testRow);

    return NextResponse.json({ 
      success: true, 
      message: 'Test row added to Google Sheet',
      spreadsheetId 
    });
  } catch (error: any) {
    console.error('[TEST SHEETS] Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
      details: JSON.stringify(error, null, 2)
    }, { status: 500 });
  }
}
