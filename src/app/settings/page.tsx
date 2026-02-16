'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { useServerStatus } from '@/hooks/useServerStatus';
import type { ServerConfig } from '@/types/minecraft';
import { Server, Shield, Users, Gamepad2, Eye, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status } = useServerStatus();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();

        if (data.success) {
          setConfig(data.data);
        } else {
          setError(data.error || 'Failed to load configuration');
        }
      } catch (err) {
        setError('Failed to load server configuration');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

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
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Settings
              </h1>
              <p className="text-text-muted">
                View server configuration (read-only from server.properties)
              </p>
            </div>

            {error && (
              <div className="bg-accent-red/20 border border-accent-red/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-accent-red" />
                  <p className="text-accent-red">{error}</p>
                </div>
                <p className="text-sm text-text-muted mt-2">
                  Make sure the dashboard has read access to server.properties.
                  Check that you've added your user to the minecraft group.
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-16 text-text-muted">
                Loading configuration...
              </div>
            ) : config ? (
              <div className="space-y-6">
                {/* Server Info */}
                <div className="bg-card border border-card-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Server className="w-5 h-5 text-accent-gold" />
                    Server Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-background rounded-lg border border-card-border">
                      <p className="text-sm text-text-muted mb-1">Level Name</p>
                      <p className="text-foreground font-medium">{config.levelName}</p>
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-card-border">
                      <p className="text-sm text-text-muted mb-1">Server Port</p>
                      <p className="text-foreground font-medium">{config.serverPort}</p>
                    </div>
                  </div>
                </div>

                {/* Players */}
                <div className="bg-card border border-card-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent-blue" />
                    Player Settings
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-background rounded-lg border border-card-border">
                      <p className="text-sm text-text-muted mb-1">Max Players</p>
                      <p className="text-foreground font-medium">{config.maxPlayers}</p>
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-card-border">
                      <p className="text-sm text-text-muted mb-1">Spawn Protection</p>
                      <p className="text-foreground font-medium">{config.spawnProtection} blocks</p>
                    </div>
                  </div>
                </div>

                {/* Gameplay */}
                <div className="bg-card border border-card-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-accent-emerald" />
                    Gameplay
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-background rounded-lg border border-card-border">
                      <p className="text-sm text-text-muted mb-1">Gamemode</p>
                      <p className="text-foreground font-medium capitalize">{config.gamemode}</p>
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-card-border">
                      <p className="text-sm text-text-muted mb-1">Difficulty</p>
                      <p className="text-foreground font-medium capitalize">{config.difficulty}</p>
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-card-border">
                      <p className="text-sm text-text-muted mb-1">PvP</p>
                      <p className={`font-medium ${config.pvp ? 'text-accent-emerald' : 'text-accent-red'}`}>
                        {config.pvp ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-card-border">
                      <p className="text-sm text-text-muted mb-1">View Distance</p>
                      <p className="text-foreground font-medium">{config.viewDistance} chunks</p>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="bg-card border border-card-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-accent-purple" />
                    Security
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-background rounded-lg border border-card-border">
                      <p className="text-sm text-text-muted mb-1">Online Mode</p>
                      <p className={`font-medium ${config.onlineMode ? 'text-accent-emerald' : 'text-accent-orange'}`}>
                        {config.onlineMode ? 'Enabled (Mojang Auth)' : 'Disabled (Offline)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dashboard Info */}
                <div className="bg-card border border-card-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-accent-gold" />
                    Dashboard Info
                  </h2>

                  <div className="p-4 bg-background rounded-lg border border-card-border">
                    <p className="text-sm text-text-muted mb-2">
                      This dashboard connects to your Minecraft server via RCON on port 25575.
                      Configuration shown here is read-only from server.properties.
                    </p>
                    <p className="text-sm text-text-muted">
                      To change server settings, edit server.properties directly and restart the server.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
