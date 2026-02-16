import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, createSession, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials
    if (!validateCredentials(username, password)) {
      // Add small delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session token
    const token = await createSession(username);

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('[API /auth/login] Error:', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
