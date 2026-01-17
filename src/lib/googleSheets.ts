import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export async function appendToSheet(spreadsheetId: string, range: string, values: any[]) {
  try {
    const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    if (!serviceAccountB64) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 is not set');
    }

    const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf-8'));

    const auth = new google.auth.JWT(
      serviceAccount.client_email,
      undefined,
      serviceAccount.private_key,
      SCOPES
    );

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
