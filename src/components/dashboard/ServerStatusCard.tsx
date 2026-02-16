'use client';

import { StatusDot } from '@/components/ui/StatusDot';
import { MotdRenderer } from '@/components/ui/MotdRenderer';
import type { ServerStatus } from '@/types/minecraft';
import { Users, Gauge, Clock, Server } from 'lucide-react';

interface ServerStatusCardProps {
  status: ServerStatus | null;
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getTpsColor(tps: number): string {
  if (tps >= 19) return 'text-accent-emerald';
  if (tps >= 15) return 'text-accent-gold';
  return 'text-accent-red';
}

function getTpsLabel(tps: number): string {
  if (tps >= 19) return 'Excellent';
  if (tps >= 15) return 'Good';
  if (tps >= 10) return 'Poor';
  return 'Critical';
}

export function ServerStatusCard({ status }: ServerStatusCardProps) {
  const online = status?.online ?? false;

  return (
    <div className="bg-card border border-card-border rounded-xl p-6 card-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <StatusDot online={online} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Server Status
            </h2>
            <p className="text-sm text-text-muted">
              {online ? 'Server is running' : 'Server is offline'}
            </p>
          </div>
        </div>
        {status?.version && (
          <span className="px-3 py-1 bg-card-border rounded-full text-sm text-text-muted">
            {status.version}
          </span>
        )}
      </div>

      {/* MOTD */}
      {status?.motd && (
        <div className="mb-6 p-4 bg-background rounded-lg border border-card-border">
          <MotdRenderer motd={status.motd} className="text-lg" />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Players */}
        <div className="bg-background rounded-lg p-4 border border-card-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-accent-blue" />
            <span className="text-sm text-text-muted">Players</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground number-transition">
              {status?.playerCount ?? 0}
            </span>
            <span className="text-sm text-text-dim">
              / {status?.maxPlayers ?? 20}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-card-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-blue rounded-full transition-all duration-300"
              style={{
                width: `${
                  status
                    ? (status.playerCount / status.maxPlayers) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* TPS */}
        <div className="bg-background rounded-lg p-4 border border-card-border">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-accent-gold" />
            <span className="text-sm text-text-muted">TPS</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold number-transition ${getTpsColor(
                status?.tps.oneMin ?? 0
              )}`}
            >
              {status?.tps.oneMin.toFixed(1) ?? '0.0'}
            </span>
            <span className={`text-sm ${getTpsColor(status?.tps.oneMin ?? 0)}`}>
              {getTpsLabel(status?.tps.oneMin ?? 0)}
            </span>
          </div>
          <div className="mt-2 text-xs text-text-dim">
            5m: {status?.tps.fiveMin.toFixed(1) ?? '0.0'} |{' '}
            15m: {status?.tps.fifteenMin.toFixed(1) ?? '0.0'}
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-background rounded-lg p-4 border border-card-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent-emerald" />
            <span className="text-sm text-text-muted">Uptime</span>
          </div>
          <span className="text-2xl font-bold text-foreground number-transition">
            {formatUptime(status?.uptime ?? 0)}
          </span>
        </div>

        {/* Version */}
        <div className="bg-background rounded-lg p-4 border border-card-border">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-accent-purple" />
            <span className="text-sm text-text-muted">Version</span>
          </div>
          <span className="text-lg font-bold text-foreground truncate block">
            {status?.version ?? 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}
