'use client';

import { useState, useEffect } from 'react';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { useRcon } from '@/hooks/useRcon';
import { UserPlus, X, RefreshCw, Shield, ShieldOff } from 'lucide-react';

export function WhitelistManager() {
  const { sendCommand, isLoading } = useRcon();
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWhitelist = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/whitelist');
      const data = await response.json();
      if (data.success) {
        setWhitelist(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch whitelist:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const handleAddPlayer = async () => {
    if (!newPlayer.trim()) return;

    // Validate username format
    if (!/^[a-zA-Z0-9_]{1,16}$/.test(newPlayer)) {
      alert('Invalid username format');
      return;
    }

    const response = await fetch('/api/whitelist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player: newPlayer }),
    });

    const data = await response.json();
    if (data.success) {
      setNewPlayer('');
      fetchWhitelist();
    }
  };

  const handleRemovePlayer = async (player: string) => {
    const response = await fetch('/api/whitelist/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player }),
    });

    const data = await response.json();
    if (data.success) {
      fetchWhitelist();
    }
  };

  const handleToggleWhitelist = async () => {
    await sendCommand(isEnabled ? 'whitelist off' : 'whitelist on');
    setIsEnabled(!isEnabled);
  };

  return (
    <div className="bg-card border border-card-border rounded-xl p-6 card-glow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Whitelist
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleWhitelist}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${
              isEnabled
                ? 'bg-accent-emerald/20 text-accent-emerald'
                : 'bg-accent-red/20 text-accent-red'
            }`}
            title={isEnabled ? 'Whitelist enabled' : 'Whitelist disabled'}
          >
            {isEnabled ? (
              <Shield className="w-4 h-4" />
            ) : (
              <ShieldOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={fetchWhitelist}
            disabled={isRefreshing}
            className="p-2 text-text-muted hover:text-foreground rounded-lg hover:bg-card-hover transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Add player form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Add player..."
          className="flex-1 px-3 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent-gold"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddPlayer();
          }}
        />
        <button
          onClick={handleAddPlayer}
          disabled={isLoading || !newPlayer.trim()}
          className="px-3 py-2 bg-accent-gold text-background rounded-lg hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Whitelist entries */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {whitelist.length === 0 ? (
          <p className="text-center py-4 text-text-muted">
            No players whitelisted
          </p>
        ) : (
          whitelist.map((player) => (
            <div
              key={player}
              className="flex items-center gap-3 p-2 bg-background rounded-lg border border-card-border"
            >
              <PlayerAvatar username={player} size={28} />
              <span className="flex-1 text-sm text-foreground">{player}</span>
              <button
                onClick={() => handleRemovePlayer(player)}
                disabled={isLoading}
                className="p-1 text-text-muted hover:text-accent-red transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
