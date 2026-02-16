import fs from 'fs';
import path from 'path';
import type { ServerConfig } from '@/types/minecraft';

const PROPERTIES_PATH = process.env.MC_PROPERTIES_PATH || '/opt/minecraft/server.properties';

/**
 * Parse Java .properties escape sequences
 * Handles: \\ -> \, \# -> #, \! -> !, \: -> :, \= -> =
 */
function unescapePropertyValue(value: string): string {
  return value
    .replace(/\\#/g, '#')
    .replace(/\\!/g, '!')
    .replace(/\\:/g, ':')
    .replace(/\\=/g, '=')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

/**
 * Parse server.properties file into a key-value object
 */
export function parseServerProperties(filePath?: string): Record<string, string> {
  const propertiesPath = filePath || PROPERTIES_PATH;

  try {
    const content = fs.readFileSync(propertiesPath, 'utf-8');
    const properties: Record<string, string> = {};

    for (const line of content.split('\n')) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
        continue;
      }

      // Find the first unescaped = or :
      let separatorIndex = -1;
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        const prevChar = i > 0 ? trimmed[i - 1] : '';

        if ((char === '=' || char === ':') && prevChar !== '\\') {
          separatorIndex = i;
          break;
        }
      }

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, separatorIndex).trim();
      const value = unescapePropertyValue(trimmed.substring(separatorIndex + 1).trim());

      properties[key] = value;
    }

    return properties;
  } catch (error) {
    console.error('[Config Reader] Failed to read server.properties:', error);
    return {};
  }
}

/**
 * Get typed server configuration
 */
export function getServerConfig(filePath?: string): ServerConfig {
  const props = parseServerProperties(filePath);

  return {
    motd: props['motd'] || '§bJunCraft §7- §aWelcome!',
    maxPlayers: parseInt(props['max-players'] || '20', 10),
    difficulty: props['difficulty'] || 'normal',
    gamemode: props['gamemode'] || 'survival',
    pvp: props['pvp'] !== 'false',
    onlineMode: props['online-mode'] !== 'false',
    spawnProtection: parseInt(props['spawn-protection'] || '16', 10),
    viewDistance: parseInt(props['view-distance'] || '10', 10),
    levelName: props['level-name'] || 'world',
    serverPort: parseInt(props['server-port'] || '25565', 10),
  };
}

/**
 * Get a specific property value
 */
export function getProperty(key: string, defaultValue?: string): string | undefined {
  const props = parseServerProperties();
  return props[key] ?? defaultValue;
}

/**
 * Check if server.properties file is readable
 */
export function isConfigReadable(filePath?: string): boolean {
  const propertiesPath = filePath || PROPERTIES_PATH;

  try {
    fs.accessSync(propertiesPath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the path to the server directory
 */
export function getServerDir(): string {
  return process.env.MC_SERVER_DIR || '/opt/minecraft';
}

/**
 * Get the path to the log file
 */
export function getLogPath(): string {
  return process.env.MC_LOG_PATH || path.join(getServerDir(), 'logs', 'latest.log');
}

/**
 * Get the path to the stats directory
 */
export function getStatsPath(): string {
  return process.env.MC_STATS_PATH || path.join(getServerDir(), 'world', 'stats');
}
