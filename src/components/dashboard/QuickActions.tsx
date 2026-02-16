'use client';

import { useState } from 'react';
import { useRcon } from '@/hooks/useRcon';
import {
  Sun,
  CloudRain,
  CloudLightning,
  Moon,
  Save,
  Megaphone,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export function QuickActions() {
  const { sendCommand, isLoading } = useRcon();
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');

  const handleWeather = async (weather: 'clear' | 'rain' | 'thunder') => {
    await sendCommand(`weather ${weather}`);
  };

  const handleTime = async (time: 'day' | 'night') => {
    await sendCommand(`time set ${time}`);
  };

  const handleSave = async () => {
    await sendCommand('save-all');
  };

  const handleBroadcast = async () => {
    if (broadcastMessage.trim()) {
      await sendCommand(`say ${broadcastMessage}`);
      setBroadcastMessage('');
      setShowBroadcast(false);
    }
  };

  const handleDifficulty = async (diff: string) => {
    await sendCommand(`difficulty ${diff}`);
    setDifficulty(diff);
  };

  const handleRestartWarning = async () => {
    if (confirm('Send restart warning to all players?')) {
      await sendCommand('say Server restarting in 60 seconds...');
      setTimeout(() => sendCommand('say Server restarting in 30 seconds...'), 30000);
      setTimeout(() => sendCommand('say Server restarting in 10 seconds...'), 50000);
    }
  };

  return (
    <div className="bg-card border border-card-border rounded-xl p-6 card-glow">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Quick Actions
      </h3>

      <div className="space-y-4">
        {/* Weather Controls */}
        <div>
          <label className="text-sm text-text-muted mb-2 block">Weather</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleWeather('clear')}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground hover:bg-card-hover transition-colors disabled:opacity-50"
            >
              <Sun className="w-4 h-4 text-accent-gold" />
              <span>Clear</span>
            </button>
            <button
              onClick={() => handleWeather('rain')}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground hover:bg-card-hover transition-colors disabled:opacity-50"
            >
              <CloudRain className="w-4 h-4 text-accent-blue" />
              <span>Rain</span>
            </button>
            <button
              onClick={() => handleWeather('thunder')}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground hover:bg-card-hover transition-colors disabled:opacity-50"
            >
              <CloudLightning className="w-4 h-4 text-accent-purple" />
              <span>Storm</span>
            </button>
          </div>
        </div>

        {/* Time Controls */}
        <div>
          <label className="text-sm text-text-muted mb-2 block">Time</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleTime('day')}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground hover:bg-card-hover transition-colors disabled:opacity-50"
            >
              <Sun className="w-4 h-4 text-accent-gold" />
              <span>Day</span>
            </button>
            <button
              onClick={() => handleTime('night')}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground hover:bg-card-hover transition-colors disabled:opacity-50"
            >
              <Moon className="w-4 h-4 text-accent-blue" />
              <span>Night</span>
            </button>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="text-sm text-text-muted mb-2 block">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => handleDifficulty(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent-gold"
          >
            <option value="peaceful">Peaceful</option>
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30 rounded-lg text-sm hover:bg-accent-emerald/30 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save All</span>
          </button>
          <button
            onClick={handleRestartWarning}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent-orange/20 text-accent-orange border border-accent-orange/30 rounded-lg text-sm hover:bg-accent-orange/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Restart Warn</span>
          </button>
        </div>

        {/* Broadcast */}
        <div>
          {showBroadcast ? (
            <div className="space-y-2">
              <input
                type="text"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Message to broadcast..."
                className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent-gold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBroadcast();
                  if (e.key === 'Escape') setShowBroadcast(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBroadcast}
                  disabled={isLoading || !broadcastMessage.trim()}
                  className="flex-1 px-3 py-2 bg-accent-gold text-background rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
                >
                  Send
                </button>
                <button
                  onClick={() => setShowBroadcast(false)}
                  className="px-3 py-2 bg-card-border text-foreground rounded-lg text-sm hover:bg-card-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowBroadcast(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-gold/20 text-accent-gold border border-accent-gold/30 rounded-lg text-sm hover:bg-accent-gold/30 transition-colors"
            >
              <Megaphone className="w-4 h-4" />
              <span>Broadcast Message</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
