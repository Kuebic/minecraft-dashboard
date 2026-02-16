'use client';

import type { EventType } from '@/types/minecraft';

interface EventBadgeProps {
  type: EventType;
  className?: string;
}

const EVENT_COLORS: Record<EventType, { bg: string; text: string; label: string }> = {
  join: { bg: 'bg-accent-emerald/20', text: 'text-accent-emerald', label: 'Join' },
  leave: { bg: 'bg-accent-red/20', text: 'text-accent-red', label: 'Leave' },
  death: { bg: 'bg-accent-orange/20', text: 'text-accent-orange', label: 'Death' },
  advancement: { bg: 'bg-accent-gold/20', text: 'text-accent-gold', label: 'Advancement' },
  chat: { bg: 'bg-text-dim/20', text: 'text-text-muted', label: 'Chat' },
  warning: { bg: 'bg-warning/20', text: 'text-warning', label: 'Warning' },
  error: { bg: 'bg-accent-red/20', text: 'text-accent-red', label: 'Error' },
};

export function EventBadge({ type, className = '' }: EventBadgeProps) {
  const colors = EVENT_COLORS[type] || EVENT_COLORS.chat;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text} ${className}`}
    >
      {colors.label}
    </span>
  );
}
