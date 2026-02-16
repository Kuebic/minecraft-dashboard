import { Server } from 'socket.io';
import { createServer } from 'http';
import {
  isServerOnline,
  getPlayerList,
  getTps,
  getServerVersion,
} from '../src/lib/minecraft/rcon';
import { getServerConfig, isConfigReadable, getLogPath } from '../src/lib/minecraft/config-reader';
import { LogTailer, type ParsedLogEvent } from '../src/lib/minecraft/log-parser';
import {
  insertEvent,
  insertMetrics,
  createPlayerSession,
  endPlayerSession,
} from '../src/lib/db/queries';
import type { ServerStatus, WsMessage } from '../src/types/minecraft';

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);

// Create HTTP server and Socket.IO
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://10.0.0.201:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Track server uptime
let firstConnectTime: Date | null = null;

// Log tailer instance
let logTailer: LogTailer | null = null;

/**
 * Fetch and broadcast server status
 */
async function broadcastServerStatus(): Promise<void> {
  try {
    const online = await isServerOnline();
    console.log('[WS] Server online status:', online);

    if (!online) {
      firstConnectTime = null;
      const status: ServerStatus = {
        online: false,
        motd: '',
        version: 'Unknown',
        playerCount: 0,
        maxPlayers: 0,
        tps: { oneMin: 0, fiveMin: 0, fifteenMin: 0 },
        uptime: 0,
      };

      const message: WsMessage = { type: 'server-status', data: status };
      io.emit('message', message);
      return;
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

    const message: WsMessage = { type: 'server-status', data: status };
    io.emit('message', message);

    // Store metrics in database
    insertMetrics(
      tps.oneMin,
      playerList.online,
      playerList.max || config.maxPlayers
    );
  } catch (error) {
    console.error('[WS] Error broadcasting status:', error);
  }
}

/**
 * Handle log events
 */
function handleLogEvent(event: ParsedLogEvent): void {
  // Store event in database
  const eventId = insertEvent(
    event.eventType,
    event.message,
    event.player,
    event.rawLog
  );

  // Handle player sessions
  if (event.eventType === 'join' && event.player) {
    createPlayerSession(event.player, undefined, event.ipAddress);

    const message: WsMessage = {
      type: 'player-join',
      data: {
        username: event.player,
        timestamp: new Date(),
      },
    };
    io.emit('message', message);
  }

  if (event.eventType === 'leave' && event.player) {
    endPlayerSession(event.player);

    const message: WsMessage = {
      type: 'player-leave',
      data: {
        username: event.player,
        timestamp: new Date(),
      },
    };
    io.emit('message', message);
  }

  // Broadcast event to all clients
  const eventMessage: WsMessage = {
    type: 'event',
    data: {
      id: eventId,
      timestamp: new Date(),
      eventType: event.eventType,
      player: event.player,
      message: event.message,
      rawLog: event.rawLog,
    },
  };
  io.emit('message', eventMessage);
}

/**
 * Start the log tailer
 */
async function startLogTailer(): Promise<void> {
  const logPath = getLogPath();

  logTailer = new LogTailer(logPath);

  logTailer.on('event', handleLogEvent);

  logTailer.on('error', (err: Error) => {
    console.error('[WS] Log tailer error:', err.message);
  });

  logTailer.on('started', () => {
    console.log('[WS] Log tailer started');
  });

  await logTailer.start();
}

// Handle client connections
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Send initial status immediately
  broadcastServerStatus();

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Start server
httpServer.listen(WS_PORT, () => {
  console.log(`[WS] WebSocket server running on port ${WS_PORT}`);

  // Start log tailer
  startLogTailer().catch((err) => {
    console.error('[WS] Failed to start log tailer:', err);
  });

  // Broadcast server status every 5 seconds
  setInterval(broadcastServerStatus, 5000);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('[WS] Shutting down...');

  if (logTailer) {
    logTailer.stop();
  }

  io.close();
  httpServer.close();

  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[WS] Shutting down...');

  if (logTailer) {
    logTailer.stop();
  }

  io.close();
  httpServer.close();

  process.exit(0);
});
