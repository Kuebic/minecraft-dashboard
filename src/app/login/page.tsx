'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, AlertCircle, Server } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Login failed');
        return;
      }

      // Redirect to intended destination
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-card border border-card-border rounded-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-accent-red/20 border border-accent-red/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-accent-red flex-shrink-0" />
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-text-muted mb-2">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background border border-card-border rounded-lg text-foreground placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent-gold"
              placeholder="Enter username"
              required
              autoComplete="username"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-muted mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background border border-card-border rounded-lg text-foreground placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent-gold"
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-accent-gold hover:bg-accent-gold/90 disabled:bg-accent-gold/50 text-background font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-gold/20 rounded-xl mb-4">
            <Server className="w-8 h-8 text-accent-gold" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">CraftBoard</h1>
          <p className="text-text-muted mt-2">Sign in to your dashboard</p>
        </div>

        {/* Login Form wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<div className="bg-card border border-card-border rounded-xl p-6 animate-pulse h-64" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-text-dim text-sm mt-6">Minecraft Server Dashboard</p>
      </div>
    </div>
  );
}
