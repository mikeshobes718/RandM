import { ServerClient } from 'postmark';
import { getEnv } from './env';

let _postmark: ServerClient | null = null;

export function getPostmarkClient(): ServerClient {
  if (_postmark) return _postmark;
  
  try {
    const { POSTMARK_SERVER_TOKEN } = getEnv();
    
    if (!POSTMARK_SERVER_TOKEN || POSTMARK_SERVER_TOKEN.trim() === '') {
      throw new Error('POSTMARK_SERVER_TOKEN is not configured. Please add it to your Vercel environment variables.');
    }
    
    _postmark = new ServerClient(POSTMARK_SERVER_TOKEN);
    return _postmark;
  } catch (error) {
    console.error('[Postmark] Configuration error:', error);
    throw new Error(
      'Email service is not properly configured. ' +
      'Admin: Please verify POSTMARK_SERVER_TOKEN is set in Vercel environment variables. ' +
      (error instanceof Error ? error.message : String(error))
    );
  }
}
