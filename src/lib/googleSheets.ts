import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export async function appendToSheet(spreadsheetId: string, range: string, values: any[]) {
  try {
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

    const sheets = google.sheets({ version: 'v4', auth });

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
