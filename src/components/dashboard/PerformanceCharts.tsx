'use client';

import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { TimeRange, ServerMetrics } from '@/types/minecraft';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
];

interface ChartData {
  time: string;
  tps: number;
  players: number;
}

function formatTime(timestamp: string | Date, range: TimeRange): string {
  const date = new Date(timestamp);

  if (range === '7d') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function PerformanceCharts() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [metrics, setMetrics] = useState<ServerMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/metrics?range=${timeRange}`);
        const data = await response.json();
        if (data.success) {
          setMetrics(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();

    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const chartData: ChartData[] = metrics.map((m) => ({
    time: formatTime(m.timestamp, timeRange),
    tps: m.tps || 0,
    players: m.playerCount || 0,
  }));

  // Downsample data if too many points
  const maxPoints = 50;
  const sampledData =
    chartData.length > maxPoints
      ? chartData.filter(
          (_, i) => i % Math.ceil(chartData.length / maxPoints) === 0
        )
      : chartData;

  return (
    <div className="bg-card border border-card-border rounded-xl p-6 card-glow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Performance
        </h3>
        <div className="flex gap-1 bg-background rounded-lg p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                timeRange === range.value
                  ? 'bg-accent-gold text-background'
                  : 'text-text-muted hover:text-foreground'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && metrics.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-text-muted">
          Loading metrics...
        </div>
      ) : sampledData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-text-muted">
          No data available for this time range
        </div>
      ) : (
        <div className="space-y-6">
          {/* TPS Chart */}
          <div>
            <h4 className="text-sm text-text-muted mb-3">TPS (Ticks Per Second)</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampledData}>
                  <defs>
                    <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a2a3e"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#666677"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 20]}
                    stroke="#666677"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2a3e',
                      borderRadius: '8px',
                      color: '#e5e5e5',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tps"
                    stroke="#2ECC71"
                    strokeWidth={2}
                    fill="url(#tpsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Player Count Chart */}
          <div>
            <h4 className="text-sm text-text-muted mb-3">Player Count</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampledData}>
                  <defs>
                    <linearGradient id="playersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3498DB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3498DB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a2a3e"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#666677"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#666677"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2a3e',
                      borderRadius: '8px',
                      color: '#e5e5e5',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="players"
                    stroke="#3498DB"
                    strokeWidth={2}
                    fill="url(#playersGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
