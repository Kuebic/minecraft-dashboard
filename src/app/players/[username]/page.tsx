'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { EventBadge } from '@/components/ui/EventBadge';
import { useServerStatus } from '@/hooks/useServerStatus';
import { useRcon } from '@/hooks/useRcon';
import type { PlayerStats, PlayerSession, ServerEvent } from '@/types/minecraft';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Ban,
  UserX,
  Trophy,
} from 'lucide-react';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PlayerData {
  stats: PlayerStats;
  sessions: PlayerSession[];
  events: ServerEvent[];
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function PlayerDetailPage({ params }: PageProps) {
  const { username } = use(params);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status } = useServerStatus();
  const { sendCommand, isLoading: rconLoading } = useRcon();

  useEffect(() => {
    const fetchPlayer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/players/${username}`);
        const data = await response.json();

        if (data.success) {
          setPlayerData(data.data);
        } else {
          setError(data.error || 'Failed to load player data');
        }
      } catch {
        setError('Failed to load player data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayer();
  }, [username]);

  const handleKick = async () => {
    if (confirm(`Kick ${username}?`)) {
      await sendCommand(`kick ${username}`);
    }
  };

  const handleBan = async () => {
    if (confirm(`Ban ${username}? This action cannot be undone from the dashboard.`)) {
      await sendCommand(`ban ${username}`);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          online={status?.online ?? false}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link
              href="/players"
              className="inline-flex items-center gap-2 text-text-muted hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Players
            </Link>

            {isLoading ? (
              <div className="text-center py-16 text-text-muted">
                Loading player data...
              </div>
            ) : error ? (
              <div className="bg-accent-red/20 border border-accent-red/30 rounded-xl p-6 text-center">
                <p className="text-accent-red">{error}</p>
              </div>
            ) : playerData ? (
              <>
                {/* Player Header */}
                <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-6">
                    <PlayerAvatar username={username} size={80} />

                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-foreground mb-2">
                        {username}
                      </h1>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-text-muted">First Seen</p>
                          <p className="text-foreground font-medium">
                            {formatDateTime(playerData.stats.firstSeen)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted">Last Seen</p>
                          <p className="text-foreground font-medium">
                            {formatDateTime(playerData.stats.lastSeen)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted">Total Playtime</p>
                          <p className="text-foreground font-medium">
                            {formatDuration(playerData.stats.totalPlayTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted">Sessions</p>
                          <p className="text-foreground font-medium">
                            {playerData.stats.sessionCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleKick}
                        disabled={rconLoading}
                        className="p-2 text-accent-orange hover:bg-accent-orange/10 rounded-lg transition-colors"
                        title="Kick Player"
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleBan}
                        disabled={rconLoading}
                        className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                        title="Ban Player"
                      >
                        <Ban className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sessions */}
                <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent-gold" />
                    Session History
                  </h2>

                  {playerData.sessions.length === 0 ? (
                    <p className="text-text-muted text-center py-4">
                      No session history available
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {playerData.sessions.slice(0, 10).map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 bg-background rounded-lg border border-card-border"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-text-dim" />
                            <div>
                              <p className="text-sm text-foreground">
                                {formatDateTime(session.joinTime)}
                              </p>
                              <p className="text-xs text-text-muted">
                                {session.leaveTime
                                  ? `Left: ${formatDateTime(session.leaveTime)}`
                                  : 'Currently online'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">
                              {session.durationSeconds
                                ? formatDuration(session.durationSeconds)
                                : 'Active'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Events */}
                <div className="bg-card border border-card-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-accent-gold" />
                    Recent Activity
                  </h2>

                  {playerData.events.length === 0 ? (
                    <p className="text-text-muted text-center py-4">
                      No recent activity
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {playerData.events.slice(0, 20).map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 bg-background rounded-lg border border-card-border"
                        >
                          <EventBadge type={event.eventType} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">
                              {event.message}
                            </p>
                            <p className="text-xs text-text-dim mt-1">
                              {formatDateTime(event.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
