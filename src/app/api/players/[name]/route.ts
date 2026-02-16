import { NextResponse } from 'next/server';
import { getPlayerStats, getPlayerSessions, getPlayerEvents } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { name } = await params;

    const stats = getPlayerStats(name);

    if (!stats) {
      return NextResponse.json(
        {
          success: false,
          error: 'Player not found',
        },
        { status: 404 }
      );
    }

    const sessions = getPlayerSessions(name);
    const events = getPlayerEvents(name);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        sessions,
        events,
      },
    });
  } catch (error) {
    console.error('[API /players/[name]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get player details',
      },
      { status: 500 }
    );
  }
}
