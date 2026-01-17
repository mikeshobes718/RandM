import { NextResponse } from 'next/server';
import { appendToSheet, setSheetHeaders } from '@/lib/googleSheets';

export async function GET(req: Request) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    
    if (!spreadsheetId) {
      return NextResponse.json({ 
        error: 'GOOGLE_SHEETS_ID not set',
        env: process.env.GOOGLE_SHEETS_ID 
      }, { status: 500 });
    }

    // If action=headers, set up the headers
    if (action === 'headers') {
      const headers = [
        'Date',
        'Time (EST)',
        'Business Name',
        'Phone',
        'Street Address',
        'City',
        'State',
        'Rating',
        'Google Place ID',
        'Website',
        'Times Called',
        'Outcome',
        'Notes',
        'Follow-up Date',
        'Rep Email',
        'Rep ID',
      ];
      
      await setSheetHeaders(spreadsheetId, headers);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Headers updated in Google Sheet',
        headers,
        spreadsheetId 
      });
    }

    // Default: add a test row
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      timeZone: 'America/New_York', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
      timeZone: 'America/New_York', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true
    }) + ' EST';

    const testRow = [
      dateStr,                              // Date
      timeStr,                              // Time (EST)
      'TEST Business',                      // Business Name
      '+1 555-123-4567',                    // Phone
      '123 Main Street',                    // Street Address
      'Test City',                          // City
      'NY',                                 // State
      '4.5',                                // Rating
      'ChIJ_test_place_id_12345',          // Google Place ID
      'https://testbusiness.com',           // Website
      '1',                                  // Times Called
      'test',                               // Outcome
      'This is a test call log',            // Notes
      '',                                   // Follow-up Date
      'test@example.com',                   // Rep Email
      'REP001',                             // Rep ID
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
