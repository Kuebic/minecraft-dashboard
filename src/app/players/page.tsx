'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { useServerStatus } from '@/hooks/useServerStatus';
import type { PlayerStats } from '@/types/minecraft';
import { Search, Clock, Users, ArrowRight } from 'lucide-react';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function PlayersPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { status } = useServerStatus();

  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);

        const response = await fetch(`/api/players/history?${params}`);
        const data = await response.json();

        if (data.success) {
          setPlayers(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch players:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(debounce);
  }, [search]);

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
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Player History
              </h1>
              <p className="text-text-muted">
                View all players who have joined the server
              </p>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search players..."
                  className="w-full pl-10 pr-4 py-3 bg-card border border-card-border rounded-lg text-foreground placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent-gold"
                />
              </div>
            </div>

            {/* Players Table */}
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-text-muted">
                  Loading players...
                </div>
              ) : players.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                  {search ? 'No players found matching your search' : 'No player history yet'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-text-muted">
                          Player
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-text-muted">
                          First Seen
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-text-muted">
                          Last Seen
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-text-muted">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Total Time
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-text-muted">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Sessions
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-text-muted">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {players.map((player) => (
                        <tr
                          key={player.username}
                          className="hover:bg-card-hover transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <PlayerAvatar
                                username={player.username}
                                size={36}
                              />
                              <span className="font-medium text-foreground">
                                {player.username}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">
                            {formatDate(player.firstSeen)}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">
                            {formatDate(player.lastSeen)}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {formatDuration(player.totalPlayTime)}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {player.sessionCount}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/players/${player.username}`}
                              className="inline-flex items-center gap-1 text-sm text-accent-gold hover:text-accent-gold/80 transition-colors"
                            >
                              View Details
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
