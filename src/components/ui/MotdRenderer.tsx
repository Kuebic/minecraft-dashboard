'use client';

import { parseMotd, segmentToStyle } from '@/lib/minecraft/motd';

interface MotdRendererProps {
  motd: string;
  className?: string;
}

export function MotdRenderer({ motd, className = '' }: MotdRendererProps) {
  const segments = parseMotd(motd);

  return (
    <span className={`font-mono ${className}`}>
      {segments.map((segment, index) => (
        <span key={index} style={segmentToStyle(segment)}>
          {segment.text}
        </span>
      ))}
    </span>
  );
}
