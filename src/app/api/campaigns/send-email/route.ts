import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit, consumeRateLimit } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token & get business ID
    const supa = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supa.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { data: profile } = await supa
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single();
      
    if (!profile?.business_id) {
      return NextResponse.json({ error: 'No business profile found' }, { status: 400 });
    }
    
    const businessId = profile.business_id;

    // Get business details
    const { data: business } = await supa
      .from('businesses')
      .select('name, review_link, email, logo_url')
      .eq('id', businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const { recipients, subject, message, contactIds } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients provided' }, { status: 400 });
    }

    if (!message || !subject) {
      return NextResponse.json({ error: 'Subject and message content are required' }, { status: 400 });
    }

    // Check limits
    const limitCheck = await checkRateLimit(businessId);
    if (!limitCheck.allowed || limitCheck.remaining < recipients.length) {
      return NextResponse.json({ 
        error: `Monthly limit exceeded. You have ${limitCheck.remaining} sends remaining this month.` 
      }, { status: 403 });
    }

    let sentCount = 0;
    let failedCount = 0;
    
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${business.logo_url ? `<img src="${business.logo_url}" alt="${business.name}" style="max-height: 50px; margin-bottom: 20px;" />` : ''}
        <div style="white-space: pre-wrap; font-size: 16px; color: #333; line-height: 1.5;">${message}</div>
        ${business.review_link ? `
          <div style="margin-top: 30px; text-align: center;">
            <a href="${business.review_link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Leave Feedback
            </a>
          </div>
        ` : ''}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
          Sent by ${business.name}
        </div>
      </div>
    `;

    for (const email of recipients) {
      try {
        await sendEmail({
          to: email,
          subject: subject,
          html: htmlContent,
          fromName: business.name,
          replyTo: business.email || undefined
        });
        sentCount++;
      } catch (err) {
        console.error('Failed to send email to', email, err);
        failedCount++;
      }
    }

    // Record campaign
    if (sentCount > 0) {
      await consumeRateLimit(businessId, sentCount);
      
      await supa.from('campaigns').insert({
        business_id: businessId,
        name: `Direct Email Outreach: ${subject} (${sentCount} contacts)`,
        type: 'email',
        status: 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        content: message
      });
    }

    if (sentCount === 0 && failedCount > 0) {
      return NextResponse.json({ error: 'Failed to send emails. Please verify the email addresses.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      sent: sentCount,
      failed: failedCount 
    });

  } catch (err: any) {
    console.error('Send Email API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
