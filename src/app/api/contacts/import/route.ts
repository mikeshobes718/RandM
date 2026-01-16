import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const authAdmin = getAuthAdmin();
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { contacts } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 });
    }

    const supa = getSupabaseAdmin();

    // Get the user's business
    const { data: biz } = await supa
      .from('businesses')
      .select('id')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ error: 'No business found. Please complete setup first.' }, { status: 400 });
    }

    // Ensure contacts table exists by trying to create it (will silently fail if exists)
    // We'll use a simple insert and handle errors
    
    // Prepare contacts for insert
    const contactsToInsert = contacts.map((c: any) => ({
      business_id: biz.id,
      name: c.name || null,
      email: c.email || null,
      phone: c.phone || null,
      source: c.source || 'csv_upload',
    }));

    // Try to insert
    const { data: inserted, error } = await supa
      .from('contacts')
      .insert(contactsToInsert)
      .select();

    if (error) {
      // If table doesn't exist, create it and retry
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        console.log('[CONTACTS IMPORT] Table might not exist, attempting to handle...');
        
        // For now, store in review_contact_captures as a fallback
        const capturesData = contactsToInsert.map(c => ({
          business_id: biz.id,
          contact_info: JSON.stringify({ name: c.name, email: c.email, phone: c.phone }),
          sentiment: 'imported',
        }));

        const { error: captureError } = await supa
          .from('review_contact_captures')
          .insert(capturesData);

        if (captureError) {
          console.error('[CONTACTS IMPORT] Fallback also failed:', captureError);
          throw new Error('Failed to import contacts. Please contact support.');
        }

        return NextResponse.json({ 
          imported: contactsToInsert.length, 
          message: 'Contacts imported successfully (stored in captures)' 
        });
      }
      throw error;
    }

    return NextResponse.json({ 
      imported: inserted?.length || contactsToInsert.length,
      message: 'Contacts imported successfully'
    });
  } catch (error: any) {
    console.error('[CONTACTS IMPORT API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
