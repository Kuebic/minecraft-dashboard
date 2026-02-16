'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { ConsoleTerminal } from '@/components/dashboard/ConsoleTerminal';
import { useServerStatus } from '@/hooks/useServerStatus';

export default function ConsolePage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { status } = useServerStatus();

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

        <main className="flex-1 p-6 flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Console</h1>
            <p className="text-text-muted">
              Send commands directly to the Minecraft server via RCON
            </p>
          </div>

          <div className="flex-1 bg-card border border-card-border rounded-xl p-6">
            <ConsoleTerminal fullScreen />
          </div>
        </main>
      </div>
    </div>
  );
}
