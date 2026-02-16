import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'craftboard.db');

/**
 * Initialize database and run migrations
 */
export function initializeDatabase(db: Database.Database): void {
  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');

  // Create player_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS player_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      uuid TEXT,
      join_time DATETIME NOT NULL,
      leave_time DATETIME,
      duration_seconds INTEGER,
      ip_address TEXT
    )
  `);

  // Create server_events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS server_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME NOT NULL,
      event_type TEXT NOT NULL,
      player TEXT,
      message TEXT NOT NULL,
      raw_log TEXT
    )
  `);

  // Create server_metrics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS server_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME NOT NULL,
      tps REAL,
      player_count INTEGER,
      max_players INTEGER,
      memory_used_mb INTEGER,
      memory_max_mb INTEGER
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_username ON player_sessions(username);
    CREATE INDEX IF NOT EXISTS idx_sessions_join_time ON player_sessions(join_time);
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON server_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_type ON server_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_player ON server_events(player);
    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON server_metrics(timestamp);
  `);

  console.log('[DB] Database initialized successfully');
}

export { DB_PATH };
