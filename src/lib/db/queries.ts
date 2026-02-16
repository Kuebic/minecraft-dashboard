import { getDatabase } from './index';
import type {
  ServerEvent,
  EventType,
  PlayerSession,
  PlayerStats,
  ServerMetrics,
  TimeRange,
} from '@/types/minecraft';

// ==================== Player Sessions ====================

/**
 * Create a new player session (player joined)
 */
export function createPlayerSession(
  username: string,
  uuid?: string,
  ipAddress?: string
): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO player_sessions (username, uuid, join_time, ip_address)
    VALUES (?, ?, datetime('now'), ?)
  `);
  const result = stmt.run(username, uuid || null, ipAddress || null);
  return result.lastInsertRowid as number;
}

/**
 * End a player session (player left)
 */
export function endPlayerSession(username: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE player_sessions
    SET leave_time = datetime('now'),
        duration_seconds = CAST((julianday('now') - julianday(join_time)) * 86400 AS INTEGER)
    WHERE username = ? AND leave_time IS NULL
  `);
  stmt.run(username);
}

/**
 * Get active sessions (players currently online based on DB)
 */
export function getActiveSessions(): PlayerSession[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, username, uuid, join_time, leave_time, duration_seconds, ip_address
    FROM player_sessions
    WHERE leave_time IS NULL
    ORDER BY join_time DESC
  `);
  return stmt.all() as PlayerSession[];
}

/**
 * Get player session history
 */
export function getPlayerSessions(
  username: string,
  limit = 100
): PlayerSession[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, username, uuid, join_time, leave_time, duration_seconds, ip_address
    FROM player_sessions
    WHERE username = ?
    ORDER BY join_time DESC
    LIMIT ?
  `);
  return stmt.all(username, limit) as PlayerSession[];
}

/**
 * Get all player stats
 */
export function getAllPlayerStats(
  search?: string,
  limit = 100,
  offset = 0
): PlayerStats[] {
  const db = getDatabase();

  let query = `
    SELECT
      username,
      MIN(join_time) as firstSeen,
      MAX(COALESCE(leave_time, join_time)) as lastSeen,
      SUM(COALESCE(duration_seconds, 0)) as totalPlayTime,
      COUNT(*) as sessionCount,
      AVG(COALESCE(duration_seconds, 0)) as avgSessionLength
    FROM player_sessions
  `;

  const params: (string | number)[] = [];

  if (search) {
    query += ' WHERE username LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' GROUP BY username ORDER BY lastSeen DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params) as PlayerStats[];
}

/**
 * Get stats for a specific player
 */
export function getPlayerStats(username: string): PlayerStats | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      username,
      MIN(join_time) as firstSeen,
      MAX(COALESCE(leave_time, join_time)) as lastSeen,
      SUM(COALESCE(duration_seconds, 0)) as totalPlayTime,
      COUNT(*) as sessionCount,
      AVG(COALESCE(duration_seconds, 0)) as avgSessionLength
    FROM player_sessions
    WHERE username = ?
    GROUP BY username
  `);
  return stmt.get(username) as PlayerStats | null;
}

// ==================== Server Events ====================

/**
 * Insert a new server event
 */
export function insertEvent(
  eventType: EventType,
  message: string,
  player?: string,
  rawLog?: string
): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO server_events (timestamp, event_type, player, message, raw_log)
    VALUES (datetime('now'), ?, ?, ?, ?)
  `);
  const result = stmt.run(eventType, player || null, message, rawLog || null);
  return result.lastInsertRowid as number;
}

/**
 * Get recent events
 */
export function getRecentEvents(
  limit = 100,
  eventTypes?: EventType[],
  offset = 0
): ServerEvent[] {
  const db = getDatabase();

  let query = `
    SELECT id, timestamp, event_type as eventType, player, message, raw_log as rawLog
    FROM server_events
  `;

  const params: (string | number)[] = [];

  if (eventTypes && eventTypes.length > 0) {
    const placeholders = eventTypes.map(() => '?').join(', ');
    query += ` WHERE event_type IN (${placeholders})`;
    params.push(...eventTypes);
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params) as ServerEvent[];
}

/**
 * Get events for a specific player
 */
export function getPlayerEvents(
  username: string,
  limit = 100
): ServerEvent[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, timestamp, event_type as eventType, player, message, raw_log as rawLog
    FROM server_events
    WHERE player = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return stmt.all(username, limit) as ServerEvent[];
}

// ==================== Server Metrics ====================

/**
 * Insert server metrics
 */
export function insertMetrics(
  tps: number,
  playerCount: number,
  maxPlayers: number,
  memoryUsedMb?: number,
  memoryMaxMb?: number
): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO server_metrics (timestamp, tps, player_count, max_players, memory_used_mb, memory_max_mb)
    VALUES (datetime('now'), ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    tps,
    playerCount,
    maxPlayers,
    memoryUsedMb || null,
    memoryMaxMb || null
  );
  return result.lastInsertRowid as number;
}

/**
 * Get metrics for a time range
 */
export function getMetrics(timeRange: TimeRange): ServerMetrics[] {
  const db = getDatabase();

  const timeFilters: Record<TimeRange, string> = {
    '1h': "datetime('now', '-1 hour')",
    '6h': "datetime('now', '-6 hours')",
    '24h': "datetime('now', '-24 hours')",
    '7d': "datetime('now', '-7 days')",
  };

  const stmt = db.prepare(`
    SELECT
      id,
      timestamp,
      tps,
      player_count as playerCount,
      max_players as maxPlayers,
      memory_used_mb as memoryUsedMb,
      memory_max_mb as memoryMaxMb
    FROM server_metrics
    WHERE timestamp >= ${timeFilters[timeRange]}
    ORDER BY timestamp ASC
  `);

  return stmt.all() as ServerMetrics[];
}

/**
 * Clean up old metrics (keep only last 7 days)
 */
export function cleanupOldMetrics(): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM server_metrics
    WHERE timestamp < datetime('now', '-7 days')
  `);
  const result = stmt.run();
  return result.changes;
}

/**
 * Clean up old events (keep only last 30 days)
 */
export function cleanupOldEvents(): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM server_events
    WHERE timestamp < datetime('now', '-30 days')
  `);
  const result = stmt.run();
  return result.changes;
}

/**
 * Get count of events by type
 */
export function getEventCounts(): Record<EventType, number> {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT event_type as eventType, COUNT(*) as count
    FROM server_events
    GROUP BY event_type
  `);
  const rows = stmt.all() as { eventType: EventType; count: number }[];

  const counts: Record<EventType, number> = {
    join: 0,
    leave: 0,
    death: 0,
    advancement: 0,
    chat: 0,
    warning: 0,
    error: 0,
  };

  for (const row of rows) {
    counts[row.eventType] = row.count;
  }

  return counts;
}
