import { NextResponse } from 'next/server';
import { addToWhitelist, isServerOnline } from '@/lib/minecraft/rcon';

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

    // Validate player name format
    if (!/^[a-zA-Z0-9_]{1,16}$/.test(player)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid player name format',
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

    const result = await addToWhitelist(player);

    return NextResponse.json({
      success: result.success,
      response: result.response,
      error: result.error,
    });
  } catch (error) {
    console.error('[API /whitelist/add] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add player to whitelist',
      },
      { status: 500 }
    );
  }
}
