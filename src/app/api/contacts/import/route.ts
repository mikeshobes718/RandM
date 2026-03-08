import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

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

    // 1. Fetch existing contacts for this business to avoid duplicates
    const { data: existingContacts } = await supa
      .from('contacts')
      .select('email, phone')
      .eq('business_id', biz.id);

    const existingEmails = new Set(existingContacts?.map(c => c.email?.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(existingContacts?.map(c => {
      const parsed = parsePhoneNumberFromString(c.phone || '');
      return parsed ? parsed.format('E.164') : c.phone?.replace(/\D/g, '');
    }).filter(Boolean));

    // Prepare contacts for insert, filtering out duplicates
    const contactsToInsert = contacts
      .map((c: any) => {
        let normalizedPhone = c.phone || null;
        if (c.phone) {
          const parsed = parsePhoneNumberFromString(c.phone, (c.country as CountryCode) || 'US');
          if (parsed) {
            normalizedPhone = parsed.format('E.164');
          } else {
            // Fallback for non-standard formats
            normalizedPhone = c.phone.replace(/\D/g, '');
            if (normalizedPhone.length === 10) normalizedPhone = '+1' + normalizedPhone;
          }
        }

        return {
          business_id: biz.id,
          name: c.name || null,
          email: c.email?.toLowerCase() || null,
          phone: normalizedPhone,
          source: c.source || 'csv_upload',
        };
      })
      .filter((c: any) => {
        // Only include if neither email nor phone is already in the DB
        const hasExistingEmail = c.email && existingEmails.has(c.email);
        const hasExistingPhone = c.phone && existingPhones.has(c.phone);
        return !hasExistingEmail && !hasExistingPhone;
      });

    if (contactsToInsert.length === 0) {
      return NextResponse.json({ 
        imported: 0, 
        message: 'All contacts were already in your list. No new duplicates added.' 
      });
    }

    // Try to insert
    const { data: inserted, error } = await supa
      .from('contacts')
      .insert(contactsToInsert)
      .select();

    if (error) {
      console.error('[CONTACTS IMPORT] Insert failed:', error);
      throw new Error('Failed to import contacts. Please ensure the contacts table is set up.');
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
