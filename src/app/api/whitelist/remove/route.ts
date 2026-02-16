import { NextResponse } from 'next/server';
import { removeFromWhitelist, isServerOnline } from '@/lib/minecraft/rcon';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { player } = body;

    if (!player || typeof player !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid player name',
        },
        { status: 400 }
      );
    }

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

    const result = await removeFromWhitelist(player);

    return NextResponse.json({
      success: result.success,
      response: result.response,
      error: result.error,
    });
  } catch (error) {
    console.error('[API /whitelist/remove] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove player from whitelist',
      },
      { status: 500 }
    );
  }
}
