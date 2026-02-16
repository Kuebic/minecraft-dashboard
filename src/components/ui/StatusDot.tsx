'use client';

interface StatusDotProps {
  online: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusDot({ online, size = 'md' }: StatusDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const color = online ? 'bg-online' : 'bg-offline';

  return (
    <span className="relative flex items-center justify-center">
      <span
        className={`${sizeClasses[size]} ${color} rounded-full ${online ? 'pulse' : ''}`}
      />
      {online && (
        <span
          className={`absolute ${sizeClasses[size]} ${color} rounded-full animate-ping opacity-75`}
        />
      )}
    </span>
  );
}
