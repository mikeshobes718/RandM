import { getSupabaseAdmin } from './supabaseAdmin';
import { sendEmail } from './emailService';
import { brandedHtml } from './emailTemplates';

interface FeedbackNotificationOptions {
  businessId: string;
  rating: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  comment?: string;
  source?: string;
}

export async function sendOwnerFeedbackNotification(options: FeedbackNotificationOptions) {
  const { businessId, rating, customerName, customerEmail, customerPhone, comment, source } = options;
  
  try {
    const supa = getSupabaseAdmin();
    
    // 1. Get business and owner info
    const { data: biz, error: bizErr } = await supa
      .from('businesses')
      .select('name, owner_uid')
      .eq('id', businessId)
      .single();
      
    if (bizErr || !biz) {
      console.error('[Notification] Business not found:', businessId);
      return;
    }
    
    // 2. Get owner's email
    const { data: owner, error: ownerErr } = await supa
      .from('users')
      .select('email')
      .eq('uid', biz.owner_uid)
      .single();
      
    if (ownerErr || !owner?.email) {
      console.error('[Notification] Owner email not found for UID:', biz.owner_uid);
      return;
    }

    // 3. Prepare the email content
    const isPositive = rating >= 5;
    const starString = '⭐'.repeat(rating);
    const title = isPositive 
      ? `New 5-Star Review for ${biz.name}!` 
      : `New Feedback Received for ${biz.name}`;
      
    const intro = `
      <div style="background-color: ${isPositive ? '#f0fdf4' : '#fff7ed'}; padding: 20px; border-radius: 12px; border: 1px solid ${isPositive ? '#bbf7d0' : '#ffedd5'}; margin-bottom: 24px;">
        <div style="font-size: 24px; margin-bottom: 8px;">${starString}</div>
        <div style="font-weight: 800; color: #0f172a; font-size: 18px;">${rating} Out of 5 Stars</div>
        <p style="margin-top: 8px; color: #475569; font-size: 14px;">
          ${isPositive 
            ? 'A customer just selected 5 stars and was redirected to your Google profile.' 
            : 'A customer has left private feedback for your business.'}
        </p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 12px;">Customer Details</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 100px;">Name:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${customerName || 'Anonymous'}</td>
          </tr>
          ${customerEmail ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Email:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${customerEmail}</td>
          </tr>` : ''}
          ${customerPhone ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Phone:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${customerPhone}</td>
          </tr>` : ''}
          ${source ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Source:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${source}</td>
          </tr>` : ''}
        </table>
      </div>

      ${comment ? `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 12px;">Message</h3>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; color: #334155; font-style: italic; border: 1px solid #e2e8f0;">
          "${comment}"
        </div>
      </div>` : ''}
    `;

    const html = brandedHtml({
      title,
      greeting: `Hi there,`,
      intro,
      ctaText: 'Open Dashboard',
      ctaUrl: 'https://reviewsandmarketing.com/dashboard',
      footerNote: 'This is an automated notification from your Reviews & Marketing toolkit.'
    });

    // 4. Send the email
    await sendEmail({
      to: owner.email,
      subject: `[R&M] ${rating}★ Review Notification: ${biz.name}`,
      html,
      text: `${title}\n\nRating: ${rating}/5\nCustomer: ${customerName || 'Anonymous'}\n${comment ? `\nMessage: "${comment}"` : ''}\n\nView details: https://reviewsandmarketing.com/dashboard`
    });

    console.log(`[Notification] Sent feedback notification to ${owner.email} for business ${businessId}`);
    
  } catch (error) {
    console.error('[Notification] Failed to send owner notification:', error);
  }
}
