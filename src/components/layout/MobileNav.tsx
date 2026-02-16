'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Terminal,
  Settings,
  X,
  Shield,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/console', label: 'Console', icon: Terminal },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-card-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-card-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-gold/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground font-mono">
                CraftBoard
              </h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
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
      </div>
    </div>
  );
}
