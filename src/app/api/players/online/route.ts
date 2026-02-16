import { NextResponse } from 'next/server';
import { getPlayerList, isServerOnline } from '@/lib/minecraft/rcon';
import { getActiveSessions } from '@/lib/db/queries';
import type { OnlinePlayer } from '@/types/minecraft';

export async function GET() {
  try {
    const online = await isServerOnline();

    if (!online) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const { players } = await getPlayerList();

    // Get session data from database for join times
    const sessions = getActiveSessions();
    const sessionMap = new Map(
      sessions.map((s) => [s.username, s])
    );

    const now = new Date();
    const onlinePlayers: OnlinePlayer[] = players.map((username) => {
      const session = sessionMap.get(username);
      const joinTime = session?.joinTime
        ? new Date(session.joinTime)
        : now;

      return {
        username,
        joinTime,
        sessionDuration: Math.floor(
          (now.getTime() - joinTime.getTime()) / 1000
        ),
      };
    });

    return NextResponse.json({
      success: true,
      data: onlinePlayers,
    });
  } catch (error) {
    console.error('[API /players/online] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get online players',
      },
      { status: 500 }
    );
  }
}
