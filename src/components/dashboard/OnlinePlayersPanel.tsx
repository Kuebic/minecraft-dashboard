'use client';

import { useState } from 'react';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import type { OnlinePlayer } from '@/types/minecraft';
import { useRcon } from '@/hooks/useRcon';
import {
  UserX,
  Ban,
  MessageSquare,
  MapPin,
  MoreVertical,
  X,
} from 'lucide-react';

interface OnlinePlayersPanelProps {
  players: OnlinePlayer[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

interface PlayerActionsProps {
  player: OnlinePlayer;
  onClose: () => void;
}

function PlayerActions({ player, onClose }: PlayerActionsProps) {
  const { sendCommand, isLoading } = useRcon();
  const [message, setMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  const handleKick = async () => {
    await sendCommand(`kick ${player.username}`);
    onClose();
  };

  const handleBan = async () => {
    if (confirm(`Are you sure you want to ban ${player.username}?`)) {
      await sendCommand(`ban ${player.username}`);
      onClose();
    }
  };

  const handleTeleportSpawn = async () => {
    await sendCommand(`tp ${player.username} 0 64 0`);
    onClose();
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      await sendCommand(`msg ${player.username} ${message}`);
      setMessage('');
      setShowMessageInput(false);
    }
  };

  if (showMessageInput) {
    return (
      <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-card-border rounded-lg shadow-lg z-10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-foreground">Message {player.username}</span>
          <button
            onClick={() => setShowMessageInput(false)}
            className="ml-auto p-1 text-text-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-background border border-card-border rounded text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent-gold"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            className="px-3 py-2 bg-accent-gold text-background rounded text-sm font-medium hover:bg-accent-gold/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-card-border rounded-lg shadow-lg z-10">
      <div className="p-1">
        <button
          onClick={() => setShowMessageInput(true)}
          disabled={isLoading}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-foreground hover:bg-card-hover rounded transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Send Message</span>
        </button>
        <button
          onClick={handleTeleportSpawn}
          disabled={isLoading}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-foreground hover:bg-card-hover rounded transition-colors"
        >
          <MapPin className="w-4 h-4" />
          <span>Teleport to Spawn</span>
        </button>
        <hr className="my-1 border-card-border" />
        <button
          onClick={handleKick}
          disabled={isLoading}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-orange hover:bg-accent-orange/10 rounded transition-colors"
        >
          <UserX className="w-4 h-4" />
          <span>Kick</span>
        </button>
        <button
          onClick={handleBan}
          disabled={isLoading}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-red hover:bg-accent-red/10 rounded transition-colors"
        >
          <Ban className="w-4 h-4" />
          <span>Ban</span>
        </button>
      </div>
    </div>
  );
}

export function OnlinePlayersPanel({ players }: OnlinePlayersPanelProps) {
  const [activePlayer, setActivePlayer] = useState<string | null>(null);

  return (
    <div className="bg-card border border-card-border rounded-xl p-6 card-glow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Online Players
        </h3>
        <span className="px-2 py-1 bg-accent-emerald/20 text-accent-emerald text-sm font-medium rounded">
          {players.length} online
        </span>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          <p>No players online</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {players.map((player) => (
            <div
              key={player.username}
              className="flex items-center gap-3 p-3 bg-background rounded-lg border border-card-border hover:border-accent-gold/30 transition-colors relative"
            >
              <PlayerAvatar username={player.username} size={40} />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {player.username}
                </p>
                <p className="text-sm text-text-muted">
                  Playing for {formatDuration(player.sessionDuration)}
                </p>
              </div>

              <button
                onClick={() =>
                  setActivePlayer(
                    activePlayer === player.username ? null : player.username
                  )
                }
                className="p-2 text-text-muted hover:text-foreground rounded hover:bg-card-hover transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {activePlayer === player.username && (
                <PlayerActions
                  player={player}
                  onClose={() => setActivePlayer(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
