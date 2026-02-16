'use client';

import { useState } from 'react';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { EventBadge } from '@/components/ui/EventBadge';
import type { ServerEvent, EventType } from '@/types/minecraft';
import { Filter } from 'lucide-react';

interface EventFeedProps {
  events: ServerEvent[];
}

const EVENT_FILTERS: { type: EventType; label: string }[] = [
  { type: 'join', label: 'Joins' },
  { type: 'leave', label: 'Leaves' },
  { type: 'death', label: 'Deaths' },
  { type: 'advancement', label: 'Advancements' },
  { type: 'chat', label: 'Chat' },
  { type: 'warning', label: 'Warnings' },
  { type: 'error', label: 'Errors' },
];

function formatTime(timestamp: Date | string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function EventFeed({ events }: EventFeedProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(
    new Set(EVENT_FILTERS.map((f) => f.type))
  );

  const toggleFilter = (type: EventType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setActiveFilters(newFilters);
  };

  const filteredEvents = events.filter((event) =>
    activeFilters.has(event.eventType)
  );

  return (
    <div className="bg-card border border-card-border rounded-xl p-6 card-glow h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Activity Feed
        </h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded transition-colors ${
            showFilters
              ? 'bg-accent-gold/20 text-accent-gold'
              : 'text-text-muted hover:text-foreground hover:bg-card-hover'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-card-border">
          {EVENT_FILTERS.map((filter) => (
            <button
              key={filter.type}
              onClick={() => toggleFilter(filter.type)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activeFilters.has(filter.type)
                  ? 'bg-accent-gold/20 text-accent-gold'
                  : 'bg-card-border text-text-muted hover:text-foreground'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Events list */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p>No events to display</p>
          </div>
        ) : (
          filteredEvents.map((event, index) => (
            <div
              key={event.id || index}
              className="flex items-start gap-3 p-3 bg-background rounded-lg border border-card-border fade-in"
            >
              {event.player ? (
                <PlayerAvatar username={event.player} size={32} />
              ) : (
                <div className="w-8 h-8 bg-card-border rounded flex items-center justify-center text-text-dim text-xs">
                  SYS
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <EventBadge type={event.eventType} />
                  <span className="text-xs text-text-dim">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-foreground truncate">
                  {event.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
