import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const body = await req.json();
    const { businessId, name, email, phone, consent, source } = body;

    if (!businessId || !email) {
      return NextResponse.json(
        { error: 'Business ID and email are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Store the contact capture in database
    const { data, error } = await supabase
      .from('review_contact_captures')
      .insert({
        business_id: businessId,
        name: name || null,
        email: email,
        phone: phone || null,
        consent: consent || false,
        source: source || 'landing',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing contact capture:', error);
      return NextResponse.json(
        { error: 'Failed to save contact information' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Contact capture error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

