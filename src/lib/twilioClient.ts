import twilio, { type Twilio } from 'twilio';

type TwilioEnv = {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_API_KEY_SID?: string;
  TWILIO_API_KEY_SECRET?: string;
};

export type TwilioClientResult =
  | { ok: true; client: Twilio }
  | { ok: false; error: string };

/**
 * Single place for Twilio REST auth. Matches Twilio Console: either
 * Account SID + Auth Token, or API Key SID + Secret + Account SID (subaccounts).
 */
export function getTwilioRestClient(env: TwilioEnv): TwilioClientResult {
  const sid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();
  const apiKeySid = env.TWILIO_API_KEY_SID?.trim();
  const apiKeySecret = env.TWILIO_API_KEY_SECRET?.trim();

  if (!sid) {
    return { ok: false, error: 'TWILIO_ACCOUNT_SID is missing.' };
  }

  // Prefer Account SID + Auth Token when set — avoids stale API key vars in env
  // shadowing updated tokens (Twilio returns 401 "Authenticate" for bad API keys).
  if (authToken) {
    return { ok: true, client: twilio(sid, authToken) };
  }

  if (apiKeySid && apiKeySecret) {
    return { ok: true, client: twilio(apiKeySid, apiKeySecret, { accountSid: sid }) };
  }

  return {
    ok: false,
    error:
      'Twilio credentials incomplete: set TWILIO_AUTH_TOKEN, or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET (with TWILIO_ACCOUNT_SID).',
  };
}

/** Normalize env From number for Twilio (E.164, no spaces). */
export function normalizeTwilioFrom(raw: string | undefined): string {
  if (!raw) return '';
  const s = raw.trim();
  const digits = s.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (s.startsWith('+')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}
