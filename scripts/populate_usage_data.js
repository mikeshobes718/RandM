
const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function populateUsage() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8'));
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1WMK5Y71w_j0EeYcYwA-7q_S8N3Zib-lZ3maQEgyKu2c';

  try {
    // 1. Fetch data from Supabase for Jan 16 and 17
    const { data: leads, error } = await supabase
      .from('leads')
      .select('created_at')
      .not('phone', 'is', null)
      .gte('created_at', '2026-01-16T00:00:00Z');

    if (error) throw error;

    const jan16 = leads.filter(l => l.created_at.startsWith('2026-01-16')).length;
    const jan17 = leads.filter(l => l.created_at.startsWith('2026-01-17')).length;

    const UNIT_PRICE = 0.025;
    const HISTORICAL_SPEND = 380.00;

    const rows = [
      // Historical Data
      ['Dec 1 - Jan 15', 'mike-gmail-reader', 'Places API', 'Place Details (Historical)', '15200', '0', '$0.025', `$${HISTORICAL_SPEND.toFixed(2)}`, `$${HISTORICAL_SPEND.toFixed(2)}`, '-', '$0.00', 'Bulk historical spend from console reports'],
      // Jan 16
      ['1/16/2026', 'mike-gmail-reader', 'Places API', 'Place Details', jan16.toString(), '0', '$0.025', `$${(jan16 * UNIT_PRICE).toFixed(2)}`, `$${(HISTORICAL_SPEND + (jan16 * UNIT_PRICE)).toFixed(2)}`, '-', '$0.00', 'Peak data ingestion / initial reveal phase'],
      // Jan 17 (Today)
      ['1/17/2026', 'mike-gmail-reader', 'Places API', 'Place Details', jan17.toString(), 'Coming Soon', '$0.025', `$${(jan17 * UNIT_PRICE).toFixed(2)}`, `$${(HISTORICAL_SPEND + (jan16 * UNIT_PRICE) + (jan17 * UNIT_PRICE)).toFixed(2)}`, '$20.71', 'TBD', 'Real-time tracking active with database caching']
    ];

    console.log('Appending rows to Google Sheet...');
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });

    console.log('✅ Usage data populated successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

populateUsage();
