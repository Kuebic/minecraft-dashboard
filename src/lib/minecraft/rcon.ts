import { Rcon } from 'rcon-client';
import type { RconResponse, TpsData } from '@/types/minecraft';

const RCON_CONFIG = {
  host: process.env.MC_SERVER_HOST || '127.0.0.1',
  port: parseInt(process.env.MC_RCON_PORT || '25575', 10),
  password: process.env.MC_RCON_PASSWORD || '',
  timeout: 5000,
};

// Singleton RCON connection
let rconInstance: Rcon | null = null;
let isConnecting = false;

/**
 * Get or create RCON connection
 */
async function getConnection(): Promise<Rcon> {
  if (rconInstance && rconInstance.authenticated) {
    return rconInstance;
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getConnection();
  }

  isConnecting = true;

  try {
    rconInstance = await Rcon.connect({
      host: RCON_CONFIG.host,
      port: RCON_CONFIG.port,
      password: RCON_CONFIG.password,
      timeout: RCON_CONFIG.timeout,
    });

    rconInstance.on('error', (err) => {
      console.error('[RCON] Connection error:', err.message);
      rconInstance = null;
    });

    rconInstance.on('end', () => {
      console.log('[RCON] Connection closed');
      rconInstance = null;
    });

    return rconInstance;
  } finally {
    isConnecting = false;
  }
}

/**
 * Send an RCON command and get the response
 */
export async function sendCommand(command: string): Promise<RconResponse> {
  try {
    const rcon = await getConnection();
    const response = await rcon.send(command);
    return {
      success: true,
      response: stripMinecraftColorCodes(response),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[RCON] Command "${command}" failed:`, errorMessage);
    return {
      success: false,
      response: '',
      error: errorMessage,
    };
  }
}

/**
 * Check if server is online by attempting RCON connection
 */
export async function isServerOnline(): Promise<boolean> {
  try {
    await getConnection();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get player list from RCON
 * Returns: { online: number, max: number, players: string[] }
 */
export async function getPlayerList(): Promise<{
  online: number;
  max: number;
  players: string[];
}> {
  const result = await sendCommand('list');

  if (!result.success) {
    return { online: 0, max: 0, players: [] };
  }

  // Parse: "There are X of a max of Y players online: Player1, Player2"
  const match = result.response.match(
    /There are (\d+) of a max of (\d+) players online:(.*)/i
  );

  if (!match) {
    return { online: 0, max: 0, players: [] };
  }

  const online = parseInt(match[1], 10);
  const max = parseInt(match[2], 10);
  const playerStr = match[3].trim();
  const players = playerStr
    ? playerStr.split(',').map((p) => p.trim()).filter(Boolean)
    : [];

  return { online, max, players };
}

/**
 * Get TPS from RCON (Paper-specific)
 * Returns: { oneMin, fiveMin, fifteenMin }
 */
export async function getTps(): Promise<TpsData> {
  const result = await sendCommand('tps');

  if (!result.success) {
    return { oneMin: 0, fiveMin: 0, fifteenMin: 0 };
  }

  // Parse: "TPS from last 1m, 5m, 15m: 20.0, 20.0, 20.0"
  // Note: Color codes are stripped, so we look for the numbers
  const match = result.response.match(
    /TPS from last 1m, 5m, 15m:\s*([\d.]+),?\s*([\d.]+),?\s*([\d.]+)/i
  );

  if (!match) {
    // Try alternative format
    const numbers = result.response.match(/[\d.]+/g);
    if (numbers && numbers.length >= 3) {
      return {
        oneMin: parseFloat(numbers[0]),
        fiveMin: parseFloat(numbers[1]),
        fifteenMin: parseFloat(numbers[2]),
      };
    }
    return { oneMin: 20, fiveMin: 20, fifteenMin: 20 };
  }

  return {
    oneMin: parseFloat(match[1]),
    fiveMin: parseFloat(match[2]),
    fifteenMin: parseFloat(match[3]),
  };
}

/**
 * Get server version from RCON
 */
export async function getServerVersion(): Promise<string> {
  const result = await sendCommand('version');

  if (!result.success) {
    return 'Unknown';
  }

  // Parse: "This server is running Paper version 1.21.1-xxx (MC: 1.21.1)"
  const match = result.response.match(
    /running\s+(\w+)\s+version\s+([^\s]+)/i
  );

  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  // Try to extract just the version number
  const versionMatch = result.response.match(/(\d+\.\d+(?:\.\d+)?)/);
  return versionMatch ? versionMatch[1] : 'Unknown';
}

/**
 * Get whitelist entries
 */
export async function getWhitelist(): Promise<string[]> {
  const result = await sendCommand('whitelist list');

  if (!result.success) {
    return [];
  }

  // Parse: "There are X whitelisted players: player1, player2"
  const match = result.response.match(/whitelisted players?:\s*(.*)/i);

  if (!match || !match[1].trim()) {
    return [];
  }

  return match[1].split(',').map((p) => p.trim()).filter(Boolean);
}

/**
 * Add player to whitelist
 */
export async function addToWhitelist(player: string): Promise<RconResponse> {
  return sendCommand(`whitelist add ${player}`);
}

/**
 * Remove player from whitelist
 */
export async function removeFromWhitelist(player: string): Promise<RconResponse> {
  return sendCommand(`whitelist remove ${player}`);
}

/**
 * Toggle whitelist on/off
 */
export async function setWhitelistEnabled(enabled: boolean): Promise<RconResponse> {
  return sendCommand(enabled ? 'whitelist on' : 'whitelist off');
}

/**
 * Kick a player
 */
export async function kickPlayer(
  player: string,
  reason?: string
): Promise<RconResponse> {
  const command = reason ? `kick ${player} ${reason}` : `kick ${player}`;
  return sendCommand(command);
}

/**
 * Ban a player
 */
export async function banPlayer(
  player: string,
  reason?: string
): Promise<RconResponse> {
  const command = reason ? `ban ${player} ${reason}` : `ban ${player}`;
  return sendCommand(command);
}

/**
 * Teleport player to coordinates
 */
export async function teleportPlayer(
  player: string,
  x: number,
  y: number,
  z: number
): Promise<RconResponse> {
  return sendCommand(`tp ${player} ${x} ${y} ${z}`);
}

/**
 * Send a message to a specific player
 */
export async function messagePlayer(
  player: string,
  message: string
): Promise<RconResponse> {
  return sendCommand(`msg ${player} ${message}`);
}

/**
 * Broadcast message to all players
 */
export async function broadcast(message: string): Promise<RconResponse> {
  return sendCommand(`say ${message}`);
}

/**
 * Set weather
 */
export async function setWeather(
  weather: 'clear' | 'rain' | 'thunder'
): Promise<RconResponse> {
  return sendCommand(`weather ${weather}`);
}

/**
 * Set time
 */
export async function setTime(time: 'day' | 'night' | number): Promise<RconResponse> {
  if (typeof time === 'number') {
    return sendCommand(`time set ${time}`);
  }
  return sendCommand(`time set ${time}`);
}

/**
 * Set difficulty
 */
export async function setDifficulty(
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard'
): Promise<RconResponse> {
  return sendCommand(`difficulty ${difficulty}`);
}

/**
 * Save all worlds
 */
export async function saveAll(): Promise<RconResponse> {
  return sendCommand('save-all');
}

/**
 * Strip Minecraft color codes (§x) from text
 */
export function stripMinecraftColorCodes(text: string): string {
  // Remove § followed by any character (color codes)
  return text.replace(/§[0-9a-fk-or]/gi, '');
}

/**
 * Close RCON connection
 */
export async function closeConnection(): Promise<void> {
  if (rconInstance) {
    await rconInstance.end();
    rconInstance = null;
  }
}
