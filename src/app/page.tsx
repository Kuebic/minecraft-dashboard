'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { ServerStatusCard } from '@/components/dashboard/ServerStatusCard';
import { OnlinePlayersPanel } from '@/components/dashboard/OnlinePlayersPanel';
import { EventFeed } from '@/components/dashboard/EventFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { WhitelistManager } from '@/components/dashboard/WhitelistManager';
import { ConsoleTerminal } from '@/components/dashboard/ConsoleTerminal';
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts';
import { useServerStatus } from '@/hooks/useServerStatus';

export default function Dashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { status, onlinePlayers, events, isConnected } = useServerStatus();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - hidden on mobile */}
      <Sidebar />

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          online={status?.online ?? false}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-6 overflow-auto">
          {/* Connection warning */}
          {!isConnected && (
            <div className="mb-6 p-4 bg-accent-orange/20 border border-accent-orange/30 rounded-lg">
              <p className="text-accent-orange text-sm">
                Connecting to WebSocket server... Real-time updates may be delayed.
              </p>
            </div>
          )}

          {/* Dashboard grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Server Status - spans full width on mobile, 8 cols on desktop */}
            <div className="lg:col-span-8">
              <ServerStatusCard status={status} />
            </div>

            {/* Quick Actions - 4 cols on desktop */}
            <div className="lg:col-span-4">
              <QuickActions />
            </div>

            {/* Online Players - 4 cols */}
            <div className="lg:col-span-4">
              <OnlinePlayersPanel players={onlinePlayers} />
            </div>

            {/* Event Feed - 4 cols */}
            <div className="lg:col-span-4">
              <EventFeed events={events} />
            </div>

            {/* Whitelist Manager - 4 cols */}
            <div className="lg:col-span-4">
              <WhitelistManager />
            </div>

            {/* Performance Charts - 8 cols */}
            <div className="lg:col-span-8">
              <PerformanceCharts />
            </div>

            {/* Console Terminal - 4 cols */}
            <div className="lg:col-span-4">
              <ConsoleTerminal />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
