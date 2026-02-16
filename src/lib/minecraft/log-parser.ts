import fs from 'fs';
import { EventEmitter } from 'events';
import type { EventType, ServerEvent } from '@/types/minecraft';

const LOG_PATTERNS = {
  // Matches: [HH:MM:SS INFO]: PlayerName joined the game
  playerJoin: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+(\w+)\s+joined the game$/,

  // Matches: [HH:MM:SS INFO]: PlayerName left the game
  playerLeave: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+(\w+)\s+left the game$/,

  // Matches: [HH:MM:SS INFO]: PlayerName death messages (various)
  playerDeath: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+(\w+)\s+(was slain|was shot|drowned|fell|burned|starved|suffocated|blew up|hit the ground|was killed|tried to swim|walked into|was pummeled|was squished|was impaled|was fireballed|was stung|froze|was skewered|went off with a bang|was squashed|discovered the floor was lava|experienced kinetic energy|didn't want to live|withered away|was poked to death|was pricked|died)/,

  // Matches: [HH:MM:SS INFO]: PlayerName has made the advancement [Advancement]
  advancement: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+(\w+)\s+has made the advancement\s+\[(.+)\]$/,

  // Matches: [HH:MM:SS INFO]: <PlayerName> message
  chat: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+<(\w+)>\s+(.+)$/,

  // Matches: [HH:MM:SS WARN]: message
  warning: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?WARN\]:\s+(.+)$/,

  // Matches: [HH:MM:SS ERROR]: message
  error: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?ERROR\]:\s+(.+)$/,

  // Extract timestamp from any log line
  timestamp: /^\[(\d{2}:\d{2}:\d{2})/,

  // Login with IP - [HH:MM:SS INFO]: PlayerName[/IP:port] logged in with entity id...
  playerLogin: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+(\w+)\[\/(\d+\.\d+\.\d+\.\d+):\d+\]\s+logged in/,
};

export interface ParsedLogEvent {
  timestamp: string;
  eventType: EventType;
  player?: string;
  message: string;
  rawLog: string;
  ipAddress?: string;
}

/**
 * Parse a single log line into a structured event
 */
export function parseLogLine(line: string): ParsedLogEvent | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  // Player join
  let match = trimmedLine.match(LOG_PATTERNS.playerJoin);
  if (match) {
    return {
      timestamp: match[1],
      eventType: 'join',
      player: match[2],
      message: `${match[2]} joined the game`,
      rawLog: trimmedLine,
    };
  }

  // Player leave
  match = trimmedLine.match(LOG_PATTERNS.playerLeave);
  if (match) {
    return {
      timestamp: match[1],
      eventType: 'leave',
      player: match[2],
      message: `${match[2]} left the game`,
      rawLog: trimmedLine,
    };
  }

  // Player login (with IP)
  match = trimmedLine.match(LOG_PATTERNS.playerLogin);
  if (match) {
    return {
      timestamp: match[1],
      eventType: 'join',
      player: match[2],
      message: `${match[2]} logged in`,
      rawLog: trimmedLine,
      ipAddress: match[3],
    };
  }

  // Player death
  match = trimmedLine.match(LOG_PATTERNS.playerDeath);
  if (match) {
    // Extract full death message after the player name
    const deathMsgMatch = trimmedLine.match(/INFO\]:\s+(.+)$/);
    const message = deathMsgMatch ? deathMsgMatch[1] : `${match[2]} died`;
    return {
      timestamp: match[1],
      eventType: 'death',
      player: match[2],
      message,
      rawLog: trimmedLine,
    };
  }

  // Advancement
  match = trimmedLine.match(LOG_PATTERNS.advancement);
  if (match) {
    return {
      timestamp: match[1],
      eventType: 'advancement',
      player: match[2],
      message: `${match[2]} has made the advancement [${match[3]}]`,
      rawLog: trimmedLine,
    };
  }

  // Chat message
  match = trimmedLine.match(LOG_PATTERNS.chat);
  if (match) {
    return {
      timestamp: match[1],
      eventType: 'chat',
      player: match[2],
      message: `<${match[2]}> ${match[3]}`,
      rawLog: trimmedLine,
    };
  }

  // Warning
  match = trimmedLine.match(LOG_PATTERNS.warning);
  if (match) {
    return {
      timestamp: match[1],
      eventType: 'warning',
      message: match[2],
      rawLog: trimmedLine,
    };
  }

  // Error
  match = trimmedLine.match(LOG_PATTERNS.error);
  if (match) {
    return {
      timestamp: match[1],
      eventType: 'error',
      message: match[2],
      rawLog: trimmedLine,
    };
  }

  return null;
}

/**
 * Log file tailer that watches for new lines
 */
export class LogTailer extends EventEmitter {
  private filePath: string;
  private watcher: fs.FSWatcher | null = null;
  private fileHandle: number | null = null;
  private lastPosition: number = 0;
  private buffer: string = '';

  constructor(filePath: string) {
    super();
    this.filePath = filePath;
  }

  /**
   * Start tailing the log file
   */
  async start(): Promise<void> {
    try {
      // Check if file exists and is readable
      await fs.promises.access(this.filePath, fs.constants.R_OK);

      // Get initial file size (start from end)
      const stats = await fs.promises.stat(this.filePath);
      this.lastPosition = stats.size;

      // Open file handle
      this.fileHandle = fs.openSync(this.filePath, 'r');

      // Watch for changes
      this.watcher = fs.watch(this.filePath, (eventType) => {
        if (eventType === 'change') {
          this.readNewLines();
        }
      });

      this.emit('started');
      console.log(`[LogTailer] Started watching: ${this.filePath}`);
    } catch (error) {
      const err = error as Error;
      console.error(`[LogTailer] Failed to start: ${err.message}`);
      this.emit('error', err);
    }
  }

  /**
   * Stop tailing the log file
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.fileHandle !== null) {
      fs.closeSync(this.fileHandle);
      this.fileHandle = null;
    }

    this.emit('stopped');
    console.log('[LogTailer] Stopped');
  }

  /**
   * Read new lines from the log file
   */
  private readNewLines(): void {
    if (this.fileHandle === null) return;

    try {
      const stats = fs.fstatSync(this.fileHandle);
      const currentSize = stats.size;

      // File was truncated (log rotation)
      if (currentSize < this.lastPosition) {
        this.lastPosition = 0;
        this.buffer = '';
      }

      // No new content
      if (currentSize === this.lastPosition) return;

      // Read new content
      const bytesToRead = currentSize - this.lastPosition;
      const buffer = Buffer.alloc(bytesToRead);
      fs.readSync(this.fileHandle, buffer, 0, bytesToRead, this.lastPosition);

      this.lastPosition = currentSize;

      // Process the new content
      this.buffer += buffer.toString('utf-8');
      const lines = this.buffer.split('\n');

      // Keep the last incomplete line in the buffer
      this.buffer = lines.pop() || '';

      // Process complete lines
      for (const line of lines) {
        const event = parseLogLine(line);
        if (event) {
          this.emit('event', event);
        }
      }
    } catch (error) {
      console.error('[LogTailer] Error reading file:', error);
    }
  }

  /**
   * Read the last N lines from the log file (for initial load)
   */
  async readLastLines(count: number = 100): Promise<ParsedLogEvent[]> {
    const events: ParsedLogEvent[] = [];

    try {
      const content = await fs.promises.readFile(this.filePath, 'utf-8');
      const lines = content.split('\n').slice(-count);

      for (const line of lines) {
        const event = parseLogLine(line);
        if (event) {
          events.push(event);
        }
      }
    } catch (error) {
      console.error('[LogTailer] Error reading last lines:', error);
    }

    return events;
  }
}

/**
 * Check if log file is readable
 */
export async function isLogReadable(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
