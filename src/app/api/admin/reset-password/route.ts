import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Unauthorized', status: 401 };
    }

    const token = authHeader.slice(7);
    const auth = getAuthAdmin();
    
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const userRecord = await auth.getUser(uid);
    
    // Check admin status
    const isAdmin = userRecord.customClaims?.admin === true;
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const userEmail = userRecord.email?.toLowerCase();
    
    if (!isAdmin && !adminEmails.includes(userEmail || '')) {
      return { error: 'Forbidden', status: 403 };
    }

    return { uid, email: userRecord.email };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { error: 'Unauthorized', status: 401 };
  }
}

export async function POST(req: Request) {
  const authResult = await requireAdmin(req);
  if ('error' in authResult) {
    return new NextResponse(authResult.error, { status: authResult.status });
  }

  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new NextResponse('Email and password are required', { status: 400 });
    }

    const auth = getAuthAdmin();
    
    // Try to get the user by email
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (error) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Update the user's password
    await auth.updateUser(user.uid, { 
      password,
      emailVerified: true 
    });

    return NextResponse.json({ 
      success: true, 
      message: `Password updated for ${email}`,
      uid: user.uid 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
