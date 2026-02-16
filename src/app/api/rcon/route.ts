import { NextResponse } from 'next/server';
import { sendCommand, isServerOnline } from '@/lib/minecraft/rcon';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const RATE_LIMIT_MAX = 20; // max 20 commands per window

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientId) || [];

  // Remove old timestamps
  const validTimestamps = timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW
  );

  if (validTimestamps.length >= RATE_LIMIT_MAX) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(clientId, validTimestamps);
  return false;
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap) {
    const validTimestamps = timestamps.filter(
      (t) => now - t < RATE_LIMIT_WINDOW
    );
    if (validTimestamps.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, validTimestamps);
    }
  }
}, 60000);

export async function POST(request: Request) {
  try {
    // Simple client identification (in production, use session/auth)
    const clientId = request.headers.get('x-forwarded-for') || 'default';

    if (isRateLimited(clientId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please wait before sending more commands.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid command',
        },
        { status: 400 }
      );
    }

    // Check if server is online
    const online = await isServerOnline();
    if (!online) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server is offline',
        },
        { status: 503 }
      );
    }

    // Send the command
    const result = await sendCommand(command);

    return NextResponse.json({
      success: result.success,
      response: result.response,
      error: result.error,
    });
  } catch (error) {
    console.error('[API /rcon] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute command',
      },
      { status: 500 }
    );
  }
}
