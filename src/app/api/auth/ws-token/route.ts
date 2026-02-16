import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/auth';

// Create a short-lived token for WebSocket connections
export async function GET(request: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Create token for WebSocket (uses same session duration)
  const wsToken = await createSession(session.username);

  return NextResponse.json({
    success: true,
    token: wsToken,
  });
}
