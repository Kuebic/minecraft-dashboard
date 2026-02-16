'use client';

import Image from 'next/image';
import { useState } from 'react';

interface PlayerAvatarProps {
  username: string;
  size?: number;
  className?: string;
}

export function PlayerAvatar({
  username,
  size = 40,
  className = '',
}: PlayerAvatarProps) {
  const [error, setError] = useState(false);

  if (error) {
    // Fallback to a default avatar
    return (
      <div
        className={`bg-card-border rounded flex items-center justify-center text-text-muted font-mono text-xs ${className}`}
        style={{ width: size, height: size }}
      >
        {username.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={`https://mc-heads.net/avatar/${username}/${size}`}
      alt={`${username}'s avatar`}
      width={size}
      height={size}
      className={`rounded ${className}`}
      onError={() => setError(true)}
      unoptimized
    />
  );
}
