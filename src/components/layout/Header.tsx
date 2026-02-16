'use client';

import { StatusDot } from '@/components/ui/StatusDot';
import { Settings, Bell, Menu, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  online: boolean;
  onMenuClick?: () => void;
}

export function Header({ online, onMenuClick }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-card-border">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 text-text-muted hover:text-foreground transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Page title - hidden on mobile */}
      <div className="hidden md:block">
        <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Server status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-card-border">
          <StatusDot online={online} size="sm" />
          <span className="text-sm font-medium">
            Server {online ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Notifications (placeholder) */}
        <button className="p-2 text-text-muted hover:text-foreground transition-colors rounded-lg hover:bg-card-hover">
          <Bell className="w-5 h-5" />
        </button>

        {/* Settings link */}
        <Link
          href="/settings"
          className="p-2 text-text-muted hover:text-foreground transition-colors rounded-lg hover:bg-card-hover"
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="p-2 text-text-muted hover:text-accent-red transition-colors rounded-lg hover:bg-card-hover"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
