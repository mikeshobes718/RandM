/**
 * Multi-Provider Email Service
 * Tries Postmark first, falls back to Resend if it fails
 * Includes retry logic and detailed error tracking
 */

import { ServerClient } from 'postmark';
import { Resend } from 'resend';
import { getEnv } from './env';

let _postmark: ServerClient | null = null;
let _resend: Resend | null = null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  provider: 'postmark' | 'resend' | 'none';
  messageId?: string;
  error?: string;
  attempts: number;
}

function getPostmarkClient(): ServerClient | null {
  if (_postmark) return _postmark;
  
  try {
    const env = getEnv();
    if (!env.POSTMARK_SERVER_TOKEN || env.POSTMARK_SERVER_TOKEN.trim() === '') {
      console.warn('[EmailService] POSTMARK_SERVER_TOKEN not configured');
      return null;
    }
    
    _postmark = new ServerClient(env.POSTMARK_SERVER_TOKEN);
    return _postmark;
  } catch (error) {
    console.error('[EmailService] Postmark initialization failed:', error);
    return null;
  }
}

function getResendClient(): Resend | null {
  if (_resend) return _resend;
  
  try {
    // Check if RESEND_API_KEY is available
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey || resendKey.trim() === '') {
      console.warn('[EmailService] RESEND_API_KEY not configured');
      return null;
    }
    
    _resend = new Resend(resendKey);
    return _resend;
  } catch (error) {
    console.error('[EmailService] Resend initialization failed:', error);
    return null;
  }
}

/**
 * Send email with retry logic and multiple provider support
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { EMAIL_FROM } = getEnv();
  const from = options.from || EMAIL_FROM;
  let attempts = 0;
  
  // Try Postmark first (primary)
  const postmark = getPostmarkClient();
  if (postmark) {
    attempts++;
    try {
      console.log(`[EmailService] Attempt ${attempts}: Trying Postmark...`);
      
      const result = await postmark.sendEmail({
        From: from,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
        TextBody: options.text,
        MessageStream: 'outbound',
        TrackOpens: false, // Disable tracking for faster delivery
        TrackLinks: 'None' as any, // Disable link tracking for faster delivery
      });

      const messageId = (result as any).MessageID || null;
      console.log(`[EmailService] ✅ Postmark success, MessageID: ${messageId}`);
      
      return {
        success: true,
        provider: 'postmark',
        messageId,
        attempts,
      };
    } catch (error: any) {
      console.error(`[EmailService] ❌ Postmark failed:`, {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });
      
      // If it's a client error (400-499), don't retry with Postmark
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        console.log('[EmailService] Client error detected, skipping Postmark retry');
      }
    }
  } else {
    console.log('[EmailService] Postmark not available, skipping');
  }
  
  // Try Resend as fallback
  const resend = getResendClient();
  if (resend) {
    attempts++;
    try {
      console.log(`[EmailService] Attempt ${attempts}: Trying Resend...`);
      
      const result = await resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (result.data) {
        console.log(`[EmailService] ✅ Resend success, ID: ${result.data.id}`);
        return {
          success: true,
          provider: 'resend',
          messageId: result.data.id,
          attempts,
        };
      } else if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      console.error(`[EmailService] ❌ Resend failed:`, {
        message: error.message,
        name: error.name,
      });
    }
  } else {
    console.log('[EmailService] Resend not available, skipping');
  }
  
  // All providers failed
  console.error('[EmailService] ❌ All email providers failed');
  return {
    success: false,
    provider: 'none',
    error: 'All email providers failed. Check POSTMARK_SERVER_TOKEN and RESEND_API_KEY environment variables.',
    attempts,
  };
}

/**
 * Send email with simplified template as fallback
 * If the full HTML template fails, try a minimal version
 */
export async function sendEmailWithFallback(
  options: EmailOptions,
  simplifiedHtml?: string
): Promise<EmailResult> {
  // Try full template first
  let result = await sendEmail(options);
  
  // If failed and we have a simplified version, try that
  if (!result.success && simplifiedHtml) {
    console.log('[EmailService] Trying simplified template...');
    result = await sendEmail({
      ...options,
      html: simplifiedHtml,
    });
  }
  
  return result;
}
