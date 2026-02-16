import { NextResponse } from 'next/server';
import { getWhitelist, isServerOnline } from '@/lib/minecraft/rcon';

export async function GET() {
  try {
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

    const whitelist = await getWhitelist();

    return NextResponse.json({
      success: true,
      data: whitelist,
    });
  } catch (error) {
    console.error('[API /whitelist] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get whitelist',
      },
      { status: 500 }
    );
  }
}
