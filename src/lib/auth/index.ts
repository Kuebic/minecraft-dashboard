import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Constants
export const COOKIE_NAME = 'craftboard_session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// Session payload interface
export interface SessionPayload extends JWTPayload {
  username: string;
  iat: number;
  exp: number;
}

// Get secret key for JWT signing
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.DASHBOARD_PASSWORD;
  if (!secret) {
    throw new Error('AUTH_SECRET or DASHBOARD_PASSWORD must be set');
  }
  return new TextEncoder().encode(secret);
}

// Validate credentials against environment variables
export function validateCredentials(username: string, password: string): boolean {
  const validUsername = process.env.DASHBOARD_USERNAME;
  const validPassword = process.env.DASHBOARD_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error('[Auth] DASHBOARD_USERNAME and DASHBOARD_PASSWORD must be set');
    return false;
  }

  return username === validUsername && password === validPassword;
}

// Create JWT session token
export async function createSession(username: string): Promise<string> {
  const secretKey = getSecretKey();

  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secretKey);
}

// Verify JWT session token
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

// Get session from request cookies
export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

// Set session cookie on response
export function setSessionCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

// Clear session cookie
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

// Get session from cookies (for server components/actions)
export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
