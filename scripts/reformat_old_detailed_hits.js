require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1WMK5Y71w_j0EeYcYwA-7q_S8N3Zib-lZ3maQEgyKu2c';

async function reformatOldData() {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!serviceAccountB64) {
    console.error('FIREBASE_SERVICE_ACCOUNT_B64 is not set');
    return;
  }

  const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf-8'));
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: privateKey,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    console.log('Reading existing data from Detailed Hit Log...');
    
    // Read all existing data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Detailed Hit Log!A:Z',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      console.log('No data to reformat.');
      return;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    console.log(`Found ${dataRows.length} rows to process.`);

    // Find the timestamp column index (should be column A or "Timestamp (EST)")
    let timestampIndex = 0;
    if (headers[0] && headers[0].includes('Timestamp')) {
      timestampIndex = 0;
    }

    const reformattedRows = [];

    for (const row of dataRows) {
      const timestamp = row[timestampIndex];
      
      // Skip if already in new format (has more than 3 columns filled and Date/Time/TxnID separated)
      if (row.length >= 10 && row[0] && row[1] && row[2] && !row[0].includes(',') && !row[0].includes('AM') && !row[0].includes('PM')) {
        // Already in new format, keep as-is
        reformattedRows.push(row);
        continue;
      }

      // Parse old timestamp format
      let date = '';
      let time = '';
      let txnId = row[2] || ''; // Keep existing txnId if present

      if (timestamp) {
        try {
          // Try to parse the timestamp
          const parts = timestamp.split(',');
          if (parts.length >= 2) {
            date = parts[0].trim();
            time = parts[1].trim();
          } else if (timestamp.includes('AM') || timestamp.includes('PM')) {
            // Format like "1/16/2026, 2:03:38 AM" or "1/16/2026 2:03:38 AM EST"
            const match = timestamp.match(/(\d{1,2}\/\d{1,2}\/\d{4})[,\s]+(.+)/);
            if (match) {
              date = match[1];
              time = match[2];
            }
          }
        } catch (err) {
          console.error('Error parsing timestamp:', timestamp, err);
          date = timestamp;
          time = '';
        }
      }

      // Generate txnId if missing
      if (!txnId || txnId.length < 5) {
        // Create a deterministic ID based on the row data
        const rowHash = `${row[1] || ''}-${row[3] || ''}-${timestamp}`.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
        txnId = `TXN-${Date.now()}-${rowHash}`;
      }

      // Rebuild the row in new format: Date, Time, TxnID, Business, PlaceID, Action, Cost, Source, RepID, RepEmail
      const newRow = [
        date,
        time,
        txnId,
        row[1] || '', // Business Name (was column B)
        row[2] || '', // Place ID (might have been column C)
        row[3] || '', // Action (might have been column D)
        row[4] || '', // Cost (might have been column E)
        row[5] || '', // Source (might have been column F)
        row[6] || '', // Rep ID (might have been column G)
        row[7] || ''  // Rep Email (might have been column H)
      ];

      reformattedRows.push(newRow);
    }

    // Clear existing data (except headers)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Detailed Hit Log!A2:Z',
    });

    // Write reformatted data
    if (reformattedRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Detailed Hit Log!A2',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: reformattedRows,
        },
      });
    }

    console.log(`✅ Successfully reformatted ${reformattedRows.length} rows!`);
  } catch (error) {
    console.error('❌ Error reformatting data:', error.message);
  }
}

reformatOldData();
