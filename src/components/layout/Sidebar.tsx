'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Terminal,
  Settings,
  Shield,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/console', label: 'Console', icon: Terminal },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-card-border min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-card-border">
        <div className="w-10 h-10 bg-accent-gold/20 rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-accent-gold" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground font-mono">
            CraftBoard
          </h1>
          <p className="text-xs text-text-muted">Server Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent-gold/20 text-accent-gold'
                      : 'text-text-muted hover:bg-card-hover hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-card-border">
        <p className="text-xs text-text-dim">
          CraftBoard v0.1.0
        </p>
      </div>
    </aside>
  );
}
