'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerStatus, WsMessage, ServerEvent, OnlinePlayer } from '@/types/minecraft';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface UseServerStatusReturn {
  status: ServerStatus | null;
  onlinePlayers: OnlinePlayer[];
  events: ServerEvent[];
  isConnected: boolean;
  error: string | null;
}

export function useServerStatus(): UseServerStatusReturn {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [events, setEvents] = useState<ServerEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let socket: Socket | null = null;

    async function connectSocket() {
      // Fetch WebSocket auth token
      let authToken: string | null = null;
      try {
        const tokenResponse = await fetch('/api/auth/ws-token');
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          if (tokenData.success) {
            authToken = tokenData.token;
          }
        }
      } catch {
        console.log('[WS] Could not fetch auth token, connecting without auth');
      }

      socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: authToken ? { token: authToken } : undefined,
      });

      socket.on('connect', () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (err: Error) => {
        console.error('[WS] Connection error:', err.message);
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);
      });

      socket.on('message', (message: WsMessage) => {
        switch (message.type) {
          case 'server-status':
            setStatus(message.data);
            break;

          case 'player-join':
            setOnlinePlayers((prev) => {
              // Remove if already exists, then add
              const filtered = prev.filter((p) => p.username !== message.data.username);
              return [
                ...filtered,
                {
                  username: message.data.username,
                  joinTime: new Date(message.data.timestamp),
                  sessionDuration: 0,
                },
              ];
            });
            break;

          case 'player-leave':
            setOnlinePlayers((prev) => prev.filter((p) => p.username !== message.data.username));
            break;

          case 'event':
            setEvents((prev) => {
              // Keep last 100 events
              const newEvents = [message.data, ...prev];
              return newEvents.slice(0, 100);
            });
            break;

          case 'metrics-update':
            // Update TPS in status if we have status
            setStatus((prev) =>
              prev
                ? {
                    ...prev,
                    tps: { ...prev.tps, oneMin: message.data.tps },
                    playerCount: message.data.playerCount,
                  }
                : null
            );
            break;
        }
      });

      // Fetch initial online players
      fetch('/api/players/online')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOnlinePlayers(data.data);
          }
        })
        .catch(console.error);

      // Fetch initial events
      fetch('/api/events?limit=50')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setEvents(data.data);
          }
        })
        .catch(console.error);
    }

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Update session durations every second
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlinePlayers((prev) =>
        prev.map((player) => ({
          ...player,
          sessionDuration: Math.floor(
            (Date.now() - new Date(player.joinTime).getTime()) / 1000
          ),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { status, onlinePlayers, events, isConnected, error };
}
