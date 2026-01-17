
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1WMK5Y71w_j0EeYcYwA-7q_S8N3Zib-lZ3maQEgyKu2c';

const HEADERS = [
  'Date',
  'Project ID',
  'Service Name',
  'SKU Name',
  'Requests (Charged)',
  'Requests (Cached/Free)',
  'Unit Price ($)',
  'Daily Cost ($)',
  'MTD Cumulative Cost ($)',
  'Forecasted Cost ($)',
  'Savings ($)',
  'Key Activity/Notes'
];

async function setHeaders() {
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
    console.log('Setting headers for spreadsheet:', SPREADSHEET_ID);
    
    // 1. Update header values
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet1!A1:${String.fromCharCode(64 + HEADERS.length)}1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [HEADERS],
      },
    });

    // 2. Format headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: HEADERS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.1, green: 0.1, blue: 0.1 }, // Near Black
                  textFormat: { 
                    foregroundColor: { red: 1, green: 1, blue: 1 }, // White
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          }
        ],
      },
    });

    console.log('✅ Headers set successfully!');
  } catch (error) {
    console.error('❌ Error setting headers:', error.message);
  }
}

setHeaders();
