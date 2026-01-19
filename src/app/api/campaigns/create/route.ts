import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSql } from '@/lib/supabaseAdmin';
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
    const { name, type, body: content } = body;

    if (!name || !type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supa = getSupabaseAdmin();

    // Get the user's business
    const { data: biz } = await supa
      .from('businesses')
      .select('id')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    // Create the campaign
    const { data: campaign, error } = await supa
      .from('campaigns')
      .insert({
        business_id: biz.id,
        name,
        type,
        body: content,
        status: 'completed', // Mocking completion for now since we don't have a background worker
        sent_count: 0, // In reality, this would count actual sends
        click_count: 0
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
        console.log('[CAMPAIGNS CREATE] Schema error, falling back to direct SQL...');
        const sql = getSql();
        if (sql) {
          try {
            const result = await sql`
              INSERT INTO campaigns (business_id, name, type, body, status, sent_count, click_count)
              VALUES (${biz.id}, ${name}, ${type}, ${content}, 'completed', 0, 0)
              RETURNING *
            `;
            if (result && result.length > 0) {
              return NextResponse.json({ 
                success: true, 
                campaign: result[0],
                message: 'Campaign created successfully (via SQL fallback)!' 
              });
            }
          } catch (sqlErr: any) {
            console.error('[CAMPAIGNS CREATE] SQL Fallback failed:', sqlErr);
          }
        }
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      campaign,
      message: 'Campaign created successfully!' 
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS CREATE API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
