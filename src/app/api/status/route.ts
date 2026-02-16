import { NextResponse } from 'next/server';
import {
  isServerOnline,
  getPlayerList,
  getTps,
  getServerVersion,
} from '@/lib/minecraft/rcon';
import { getServerConfig, isConfigReadable } from '@/lib/minecraft/config-reader';
import type { ServerStatus } from '@/types/minecraft';

// Track uptime from when we first connected
let firstConnectTime: Date | null = null;

export async function GET() {
  try {
    const online = await isServerOnline();

    if (!online) {
      firstConnectTime = null;
      return NextResponse.json({
        success: true,
        data: {
          online: false,
          motd: '',
          version: 'Unknown',
          playerCount: 0,
          maxPlayers: 0,
          tps: { oneMin: 0, fiveMin: 0, fifteenMin: 0 },
          uptime: 0,
        } as ServerStatus,
      });
    }

    // Track uptime
    if (!firstConnectTime) {
      firstConnectTime = new Date();
    }

    // Fetch data in parallel
    const [playerList, tps, version] = await Promise.all([
      getPlayerList(),
      getTps(),
      getServerVersion(),
    ]);

    // Get config (MOTD, max players)
    let config = { motd: '§bJunCraft §7- §aWelcome!', maxPlayers: 20 };
    if (isConfigReadable()) {
      config = getServerConfig();
    }

    const uptime = Math.floor(
      (Date.now() - firstConnectTime.getTime()) / 1000
    );

    const status: ServerStatus = {
      online: true,
      motd: config.motd,
      version,
      playerCount: playerList.online,
      maxPlayers: playerList.max || config.maxPlayers,
      tps,
      uptime,
    };

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('[API /status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get server status',
      },
      { status: 500 }
    );
  }
}
