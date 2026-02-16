import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { initializeDatabase, DB_PATH } from './schema';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Singleton database instance
let db: Database.Database | null = null;

/**
 * Get database connection (singleton)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    initializeDatabase(db);
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Export schema for external use
export { DB_PATH } from './schema';
