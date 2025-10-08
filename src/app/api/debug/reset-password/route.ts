import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
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
      uid: user.uid,
      newPassword: password
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
