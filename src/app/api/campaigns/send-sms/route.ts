import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendSMS } from '@/lib/twilio';
import { checkRateLimit, consumeRateLimit } from '@/lib/rateLimit';

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
      .select('name, review_link, twilio_number')
      .eq('id', businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const { recipients, message, contactIds } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients provided' }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Check limits
    const limitCheck = await checkRateLimit(businessId);
    if (!limitCheck.allowed || limitCheck.remaining < recipients.length) {
      return NextResponse.json({ 
        error: `Monthly limit exceeded. You have ${limitCheck.remaining} sends remaining this month.` 
      }, { status: 403 });
    }

    // Prepare message (auto-prefix business name if not present)
    let finalMessage = message;
    if (!finalMessage.toLowerCase().includes(business.name.toLowerCase())) {
      finalMessage = `${business.name}: ${finalMessage}`;
    }
    
    // Add review link if missing
    if (business.review_link && !finalMessage.includes('http')) {
       finalMessage += `\n\nLeave feedback: ${business.review_link}`;
    }

    // Send SMS
    let sentCount = 0;
    let failedCount = 0;
    
    for (const phone of recipients) {
      try {
        await sendSMS(phone, finalMessage, business.twilio_number);
        sentCount++;
      } catch (err) {
        console.error('Failed to send SMS to', phone, err);
        failedCount++;
      }
    }

    // Record campaign
    if (sentCount > 0) {
      await consumeRateLimit(businessId, sentCount);
      
      await supa.from('campaigns').insert({
        business_id: businessId,
        name: `Direct SMS Outreach (${sentCount} contacts)`,
        type: 'sms',
        status: 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        content: finalMessage
      });
    }

    if (sentCount === 0 && failedCount > 0) {
      return NextResponse.json({ error: 'Failed to send SMS to all recipients. Check phone numbers.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      sent: sentCount,
      failed: failedCount 
    });

  } catch (err: any) {
    console.error('Send SMS API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
