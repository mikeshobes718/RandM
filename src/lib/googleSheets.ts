import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Helper to get authenticated Google Sheets client
async function getAuthenticatedClient() {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!serviceAccountB64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 is not set');
  }

  const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf-8'));

  // Ensure private_key has proper line breaks (fix escaped \n)
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: privateKey,
    scopes: SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

export async function appendToSheet(spreadsheetId: string, range: string, values: any[]) {
  try {
    const sheets = await getAuthenticatedClient();

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });

    return response.data;
  } catch (error) {
    console.error('[GOOGLE SHEETS] Error appending to sheet:', error);
    throw error;
  }
}

export async function setSheetHeaders(spreadsheetId: string, headers: string[]) {
  try {
    const sheets = await getAuthenticatedClient();

    // First, update the header row values
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A1:${String.fromCharCode(64 + headers.length)}1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    });

    // Then apply formatting (bold, dark blue background, white text, freeze row)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          // Format header row
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.16, green: 0.36, blue: 0.65 }, // Dark Blue
                  textFormat: { 
                    foregroundColor: { red: 1, green: 1, blue: 1 }, // White
                    bold: true,
                    fontSize: 11,
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
            },
          },
          // Freeze the first row
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
          },
          // Auto-resize columns to fit content
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[GOOGLE SHEETS] Error setting headers:', error);
    throw error;
  }
}
