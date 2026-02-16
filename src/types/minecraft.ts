// Server Status Types
export interface ServerStatus {
  online: boolean;
  motd: string;
  version: string;
  playerCount: number;
  maxPlayers: number;
  tps: TpsData;
  uptime: number; // in seconds
}

export interface TpsData {
  oneMin: number;
  fiveMin: number;
  fifteenMin: number;
}

// Player Types
export interface OnlinePlayer {
  username: string;
  joinTime: Date;
  sessionDuration: number; // in seconds
}

export interface PlayerSession {
  id: number;
  username: string;
  uuid?: string;
  joinTime: Date;
  leaveTime?: Date;
  durationSeconds?: number;
  ipAddress?: string;
}

export interface PlayerStats {
  username: string;
  firstSeen: Date;
  lastSeen: Date;
  totalPlayTime: number; // in seconds
  sessionCount: number;
  avgSessionLength: number; // in seconds
}

// Event Types
export type EventType = 'join' | 'leave' | 'death' | 'advancement' | 'chat' | 'warning' | 'error';

export interface ServerEvent {
  id: number;
  timestamp: Date;
  eventType: EventType;
  player?: string;
  message: string;
  rawLog?: string;
}

// Metrics Types
export interface ServerMetrics {
  id: number;
  timestamp: Date;
  tps: number;
  playerCount: number;
  maxPlayers: number;
  memoryUsedMb?: number;
  memoryMaxMb?: number;
}

// Config Types (from server.properties)
export interface ServerConfig {
  motd: string;
  maxPlayers: number;
  difficulty: string;
  gamemode: string;
  pvp: boolean;
  onlineMode: boolean;
  spawnProtection: number;
  viewDistance: number;
  levelName: string;
  serverPort: number;
}

// Whitelist Types
export interface WhitelistEntry {
  name: string;
  uuid?: string;
}

// RCON Response Types
export interface RconResponse {
  success: boolean;
  response: string;
  error?: string;
}

// WebSocket Event Types
export interface WsServerStatus {
  type: 'server-status';
  data: ServerStatus;
}

export interface WsPlayerJoin {
  type: 'player-join';
  data: {
    username: string;
    timestamp: Date;
  };
}

export interface WsPlayerLeave {
  type: 'player-leave';
  data: {
    username: string;
    timestamp: Date;
  };
}

export interface WsEvent {
  type: 'event';
  data: ServerEvent;
}

export interface WsMetricsUpdate {
  type: 'metrics-update';
  data: {
    tps: number;
    playerCount: number;
    memoryUsedMb?: number;
  };
}

export type WsMessage = WsServerStatus | WsPlayerJoin | WsPlayerLeave | WsEvent | WsMetricsUpdate;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Time Range Types for graphs
export type TimeRange = '1h' | '6h' | '24h' | '7d';
