# PRD: Minecraft Server Dashboard (CraftBoard)

## Overview

Build a self-hosted, real-time Minecraft server monitoring and management dashboard for a **Paper 1.21.1** server running on **Debian**. The app connects exclusively via **RCON** (remote console) for all server data and commands, and tails the server log for real-time events. The target user is a server admin running everything on a local machine.

### Environment Context

- **Server**: Paper 1.21.1, installed at `/opt/minecraft`, runs as the `minecraft` system user
- **Host**: Debian desktop (CLI-only), i7-12700K, 16GB RAM — also runs Jellyfin and a Valheim Docker container
- **Network**: Server is behind **TCPShield** (DDoS proxy). Port 25565 is firewalled via iptables to only accept TCPShield IPs. **Proxy Protocol is enabled** in `paper-global.yml`.
- **RCON**: Enabled on port 25575, localhost only (not firewalled). Uses `rcon-cli` v0.10.3 via `/opt/minecraft/rcon.sh`.
- **MOTD**: `§bJunCraft §7- §aWelcome!`

> **IMPORTANT — Why no MC Server List Ping:** The standard Minecraft Server List Ping protocol (TCP to port 25565) will NOT work in this environment because:
> 1. **iptables blocks localhost on 25565** — only TCPShield IPs are allowed through.
> 2. **Proxy Protocol is enabled** — Paper expects a PROXY protocol header on every TCP connection to 25565. A raw ping without that header will fail.
>
> Therefore, **all server data must come from RCON** (port 25575, which has no firewall restrictions on localhost) and **log file parsing**. Do NOT implement or attempt MC Server List Ping.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | **Next.js 14+ (App Router)** with React, TypeScript |
| Styling | **Tailwind CSS** with a custom dark theme |
| Real-time | **WebSockets** (via `socket.io` or native `ws`) |
| Backend | **Next.js API routes** + a small **Node.js WebSocket server** (can be a separate process or integrated) |
| RCON | `rcon-client` npm package |
| Config Reader | Read `server.properties` directly for MOTD, max-players, version info, etc. |
| Database | **SQLite** via `better-sqlite3` for historical data (player sessions, TPS history, events) |
| Log Parsing | Node `fs.watch` / `chokidar` to tail `logs/latest.log` |
| Charts | `recharts` for time-series graphs |

---

## Architecture

```
┌─────────────────────────────────────┐
│         Next.js Frontend            │
│  (Dashboard UI, React components)   │
│         connects via WebSocket      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Next.js API Routes +          │
│       WebSocket Server              │
│                                     │
│  ┌───────────┐  ┌────────────────┐  │
│  │ RCON Client│  │ Config Reader  │  │
│  │ (port 25575)│ │(server.props)  │  │
│  └───────────┘  └────────────────┘  │
│  ┌───────────┐  ┌────────────────┐  │
│  │ Log Tailer │  │ SQLite DB      │  │
│  │ (latest.log)│ │ (history)      │  │
│  └───────────┘  └────────────────┘  │
└──────────────┬──────────────────────┘
               │ localhost only
┌──────────────▼──────────────────────┐
│       Paper Minecraft Server        │
│       Paper 1.21.1 on Debian        │
│       /opt/minecraft                │
│       (runs as 'minecraft' user)    │
└─────────────────────────────────────┘
```

> **Note:** Port 25565 is NOT used by the dashboard. All communication goes through RCON (port 25575) and direct file reads. Port 25565 is firewalled to TCPShield IPs only.

---

## Configuration

Create a `.env.local` file (or `.env`) at the project root with these values:

```env
# Minecraft server connection
MC_SERVER_HOST=127.0.0.1
MC_RCON_PORT=25575
MC_RCON_PASSWORD=your_rcon_password_here

# Paths to Minecraft server files (server installed at /opt/minecraft)
MC_SERVER_DIR=/opt/minecraft
MC_LOG_PATH=/opt/minecraft/logs/latest.log
MC_STATS_PATH=/opt/minecraft/world/stats
MC_PROPERTIES_PATH=/opt/minecraft/server.properties

# Dashboard settings
DASHBOARD_PORT=3000
WS_PORT=3001

# Basic auth for the dashboard
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=changeme
```

**RCON is already enabled** in this server's `server.properties`:
```properties
enable-rcon=true
rcon.port=25575
rcon.password=<already set>
```

### File Permissions

The Minecraft server runs as the `minecraft` system user. The dashboard process (likely running as `kenei`) needs **read access** to several files owned by `minecraft`. Set this up before running the dashboard:

```bash
# Add your user to the minecraft group
sudo usermod -aG minecraft kenei

# Ensure group read on the relevant directories
sudo chmod g+rx /opt/minecraft
sudo chmod g+r /opt/minecraft/server.properties
sudo chmod -R g+rX /opt/minecraft/logs
sudo chmod -R g+rX /opt/minecraft/world/stats

# Log out and back in for group membership to take effect
```

Alternatively, run the dashboard as the `minecraft` user directly. The dashboard only needs to **read** these files — it never writes to the Minecraft server directory.

---

## Core Features

### 1. Server Status Card (Hero Section)

**Data source:** RCON commands + `server.properties` file read

Display at the top of the dashboard:
- **Server status:** Online / Offline indicator (green/red dot with pulse animation) — determined by whether RCON connects successfully
- **MOTD:** Read from `server.properties` (`motd` key), rendered with Minecraft color codes (§ codes → styled spans). Fallback: `§bJunCraft §7- §aWelcome!`
- **Version:** From RCON `version` command output (parses "This server is running Paper version X.X.X-XXX")
- **Player count:** `online / max` with a visual bar — online from RCON `list` command, max from `server.properties` (`max-players` key)
- **TPS:** From RCON `tps` command (Paper-specific, returns 1m/5m/15m averages)
- **Uptime:** tracked from when the dashboard first successfully connected to RCON

**Polling interval:** Every 5 seconds via WebSocket push. RCON connection attempt = server online check.

---

### 2. Online Players Panel

**Data source:** RCON `list` command + log parsing for join times

Display a live list of currently online players:
- **Player head avatar:** Use `https://mc-heads.net/avatar/{username}/40` for each player's head
- **Username**
- **Join time** (from log parsing — when they joined this session)
- **Session duration** (live counter)
- **Quick actions per player:**
  - Kick (sends RCON `kick <player>`)
  - Ban (sends RCON `ban <player>`)
  - Teleport to spawn (sends RCON `tp <player> <spawn coords>`)
  - Send message (sends RCON `msg <player> <message>`)

**Update frequency:** Every 5 seconds, or immediately on join/leave events from log.

---

### 3. Player Activity Log / Event Feed

**Data source:** Tail `logs/latest.log` with regex parsing

A real-time scrolling feed showing:
- **Player joins** — `[Server thread/INFO]: PlayerName joined the game`
- **Player leaves** — `[Server thread/INFO]: PlayerName left the game`
- **Deaths** — `[Server thread/INFO]: PlayerName was slain by ...`
- **Advancements** — `[Server thread/INFO]: PlayerName has made the advancement ...`
- **Chat messages** — `[Server thread/INFO]: <PlayerName> message`
- **Server warnings/errors** — any `[WARN]` or `[ERROR]` lines

Each event should have:
- Timestamp
- Color-coded event type (join=green, leave=red, death=orange, chat=gray, error=red, advancement=gold)
- Player avatar where applicable

Implement a filter bar to toggle event types on/off.

**Storage:** Write events to SQLite so they persist across dashboard restarts.

---

### 4. Player Session History

**Data source:** SQLite (populated from log parsing)

A searchable table/list showing:
- Player name + avatar
- First seen date
- Last seen date
- Total play time (sum of all sessions)
- Number of sessions
- Average session length
- Last known IP (from log, optional, privacy-sensitive)

Include a search bar to filter by player name.

Click on a player row to expand and show their individual session history (join/leave timestamps, duration per session).

---

### 5. Server Performance Graphs

**Data source:** RCON commands + system metrics

Charts (using `recharts`) showing:

- **TPS (Ticks Per Second)** over time — from parsing RCON `tps` command output (Paper-specific). Poll every 10 seconds, store in SQLite, display last 1h/6h/24h.
- **Player count** over time — from RCON `list` command, stored in SQLite.
- **Memory usage** — from RCON output or `process` stats if accessible. Alternatively parse the output of Paper's `/spark health` if the Spark plugin is installed.

Time range selector: 1 hour, 6 hours, 24 hours, 7 days.

---

### 6. Console / Command Interface

**Data source:** RCON

A terminal-style interface where the admin can:
- Type any Minecraft command and send it via RCON
- See the command response rendered below
- Command history (up/down arrow to recall previous commands)
- Auto-complete suggestions for common commands (`/list`, `/ban`, `/kick`, `/tp`, `/give`, `/gamemode`, `/weather`, `/time`, `/whitelist`, `/op`, `/say`)

Style this like a terminal: monospace font, dark background, green/white text.

---

### 7. Whitelist Management

**Data source:** RCON (`whitelist list`, `whitelist add`, `whitelist remove`)

A panel showing:
- Current whitelist entries
- Add player to whitelist (text input + button)
- Remove player (X button per entry)
- Toggle whitelist on/off (`whitelist on` / `whitelist off`)

---

### 8. Quick Actions Sidebar

A sidebar or top-bar with one-click server management:
- **Restart warning** — sends `say Server restarting in 60 seconds...` then a timed sequence
- **Weather controls** — Clear / Rain / Thunder buttons
- **Time controls** — Set Day / Set Night / Toggle cycle
- **Save** — sends `save-all`
- **Broadcast message** — text input to send `say <message>` to all players
- **Difficulty** — Peaceful / Easy / Normal / Hard selector

---

## Data Layer Details

### SQLite Schema

```sql
CREATE TABLE player_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  uuid TEXT,
  join_time DATETIME NOT NULL,
  leave_time DATETIME,
  duration_seconds INTEGER,
  ip_address TEXT
);

CREATE TABLE server_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME NOT NULL,
  event_type TEXT NOT NULL, -- 'join', 'leave', 'death', 'advancement', 'chat', 'warning', 'error'
  player TEXT,
  message TEXT NOT NULL,
  raw_log TEXT
);

CREATE TABLE server_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME NOT NULL,
  tps REAL,
  player_count INTEGER,
  max_players INTEGER,
  memory_used_mb INTEGER,
  memory_max_mb INTEGER
);

CREATE INDEX idx_sessions_username ON player_sessions(username);
CREATE INDEX idx_events_timestamp ON server_events(timestamp);
CREATE INDEX idx_events_type ON server_events(event_type);
CREATE INDEX idx_metrics_timestamp ON server_metrics(timestamp);
```

---

### RCON Data Strategy

Since MC Server List Ping is not available (see Overview), all live server data comes from RCON commands and file reads:

| Data Point | Source | Method |
|---|---|---|
| Server online/offline | RCON connection attempt | If `rcon-client` connects → online. If it throws → offline. |
| Player list (names) | RCON `list` | Returns `"There are X of a max of Y players online: Player1, Player2"` — parse with regex. |
| Player count / max | RCON `list` + `server.properties` | Parse count from `list`, max from `max-players` property. |
| TPS | RCON `tps` | Paper returns `"TPS from last 1m, 5m, 15m: 20.0, 20.0, 20.0"` — parse the three values. |
| Server version | RCON `version` | Returns `"This server is running Paper version 1.21.1-xxx (MC: 1.21.1) ..."` — parse version string. Run once on dashboard startup, cache. |
| MOTD | Read `server.properties` | Parse `motd=` line. File read, not RCON. Refresh on dashboard restart or manual refresh. |
| Max players | Read `server.properties` | Parse `max-players=` line. |
| Difficulty | Read `server.properties` | Parse `difficulty=` line. |
| Whitelist state | RCON `whitelist list` | Returns the current whitelist entries. |
| Gamemode | Read `server.properties` | Parse `gamemode=` line. |

**RCON Parsing Notes:**
- The `list` command output format may vary slightly between Paper versions. Use a flexible regex like: `/There are (\d+) of a max of (\d+) players online:(.*)/`
- The `tps` command is Paper-specific (vanilla doesn't have it). Output format: `§6TPS from last 1m, 5m, 15m: §a20.0, §a20.0, §a20.0` — strip § color codes before parsing.
- RCON responses may include Minecraft § color codes — always strip them from data values.

**server.properties Parser:**
Create a utility that reads `/opt/minecraft/server.properties` and returns a typed object. Java `.properties` files use `key=value` format with `\` escaping (e.g., `\#` → `#`, `\!` → `!`). Handle the backslash escaping when parsing values.

---

### Log Parsing Regexes

```typescript
const LOG_PATTERNS = {
  // Matches: [HH:MM:SS INFO]: PlayerName joined the game
  playerJoin: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+(\w+)\s+joined the game$/,

  // Matches: [HH:MM:SS INFO]: PlayerName left the game
  playerLeave: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+(\w+)\s+left the game$/,

  // Matches: [HH:MM:SS INFO]: PlayerName death messages (various)
  playerDeath: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+(\w+)\s+(was slain|was shot|drowned|fell|burned|starved|suffocated|blew up|hit the ground|was killed|tried to swim|walked into|was pummeled|was squished|was impaled|was fireballed|was stung|froze|was skewered|went off with a bang|was squashed|discovered the floor was lava|experienced kinetic energy|didn't want to live|withered away)/,

  // Matches: [HH:MM:SS INFO]: PlayerName has made the advancement [Advancement]
  advancement: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+(\w+)\s+has made the advancement\s+\[(.+)\]$/,

  // Matches: [HH:MM:SS INFO]: <PlayerName> message
  chat: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?INFO\]:\s+<(\w+)>\s+(.+)$/,

  // Matches: [HH:MM:SS WARN]: message
  warning: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?WARN\]:\s+(.+)$/,

  // Matches: [HH:MM:SS ERROR]: message
  error: /^\[(\d{2}:\d{2}:\d{2})\s+\w+\/?ERROR\]:\s+(.+)$/,
};
```

---

## UI / Design Direction

### Theme: "Nether Command Center"

A dark, atmospheric dashboard with a Minecraft-inspired but modern aesthetic.

- **Background:** Very dark gray (`#0a0a0f`) with subtle noise texture
- **Primary accent:** Warm amber/gold (`#F5A623`) — like glowstone
- **Secondary accent:** Deep emerald green (`#2ECC71`) — for online/success states
- **Danger/error:** Nether red (`#E74C3C`)
- **Cards:** Dark charcoal (`#1a1a2e`) with subtle borders (`#2a2a3e`), slight glow on hover
- **Font (headings):** `JetBrains Mono` or `Space Mono` — command-line feel
- **Font (body):** `IBM Plex Sans` — clean and readable
- **Pixel art touches:** Use Minecraft-style pixel borders or icons sparingly (player heads, item icons)
- **Animations:** Subtle pulse on the server status dot, smooth number transitions for player counts and TPS, fade-in for new log entries

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] CraftBoard          [Server: Online] [Settings] │
├────────────────────┬────────────────────────────────────┤
│                    │                                    │
│  Server Status     │   Player Activity Feed             │
│  Card (hero)       │   (scrolling event log)            │
│                    │                                    │
├────────────────────┤                                    │
│                    │                                    │
│  Online Players    │                                    │
│  (list + actions)  │                                    │
│                    ├────────────────────────────────────┤
├────────────────────┤                                    │
│                    │   Performance Graphs               │
│  Quick Actions     │   (TPS, players, memory)           │
│  (sidebar buttons) │                                    │
│                    ├────────────────────────────────────┤
├────────────────────┤                                    │
│                    │   Console / Command Interface      │
│  Whitelist Mgmt    │   (terminal-style)                 │
│                    │                                    │
└────────────────────┴────────────────────────────────────┘
```

Use a responsive grid — on mobile, stack into a single column.

---

## Pages / Routes

| Route | Description |
|---|---|
| `/` | Main dashboard (all panels above) |
| `/players` | Full player history table with search and sort |
| `/players/[username]` | Individual player detail page (session history, stats) |
| `/console` | Full-screen console/terminal view |
| `/settings` | Configure connection settings, manage auth |

---

## Authentication

Implement basic authentication middleware:
- Use the `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` from env
- Simple login page with username/password
- Store session in an HTTP-only cookie (or use `next-auth` with credentials provider if preferred)
- All dashboard routes and API routes should be protected
- WebSocket connections should validate the session cookie

---

## API Routes

```
GET  /api/status          → Current server status (RCON connection check + tps + list + server.properties)
GET  /api/players/online  → Current online players (RCON list)
GET  /api/players/history → Player session history from SQLite (with pagination, search)
GET  /api/players/[name]  → Individual player details + sessions
GET  /api/events          → Recent events from SQLite (with filters, pagination)
GET  /api/metrics         → Server metrics from SQLite (with time range param)
POST /api/rcon            → Send an RCON command { command: string } → { response: string }
GET  /api/whitelist       → Current whitelist
POST /api/whitelist/add   → Add to whitelist { player: string }
POST /api/whitelist/remove → Remove from whitelist { player: string }
GET  /api/config          → Read-only server.properties values (motd, max-players, difficulty, gamemode)
```

WebSocket events (server → client):
```
'server-status'   → pushed every 5s with RCON-derived status data
'player-join'     → real-time from log
'player-leave'    → real-time from log
'event'           → any new log event
'metrics-update'  → TPS/memory/players every 10s
```

---

## Project Structure

```
craftboard/
├── .env.local
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with sidebar nav
│   │   ├── page.tsx                # Main dashboard
│   │   ├── players/
│   │   │   ├── page.tsx            # Player history table
│   │   │   └── [username]/
│   │   │       └── page.tsx        # Player detail
│   │   ├── console/
│   │   │   └── page.tsx            # Full-screen console
│   │   ├── settings/
│   │   │   └── page.tsx            # Settings page
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   └── api/
│   │       ├── status/route.ts
│   │       ├── players/
│   │       │   ├── online/route.ts
│   │       │   ├── history/route.ts
│   │       │   └── [name]/route.ts
│   │       ├── events/route.ts
│   │       ├── metrics/route.ts
│   │       ├── rcon/route.ts
│   │       ├── config/route.ts
│   │       └── whitelist/
│   │           ├── route.ts
│   │           ├── add/route.ts
│   │           └── remove/route.ts
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── ServerStatusCard.tsx
│   │   │   ├── OnlinePlayersPanel.tsx
│   │   │   ├── EventFeed.tsx
│   │   │   ├── PerformanceCharts.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── WhitelistManager.tsx
│   │   │   └── ConsoleTerminal.tsx
│   │   ├── ui/
│   │   │   ├── PlayerAvatar.tsx    # mc-heads.net integration
│   │   │   ├── StatusDot.tsx       # Pulsing online/offline indicator
│   │   │   ├── EventBadge.tsx      # Color-coded event type
│   │   │   └── MotdRenderer.tsx    # Minecraft § color code renderer
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── MobileNav.tsx
│   ├── lib/
│   │   ├── minecraft/
│   │   │   ├── rcon.ts             # RCON client wrapper
│   │   │   ├── config-reader.ts    # server.properties parser (reads MOTD, max-players, etc.)
│   │   │   ├── log-parser.ts       # Log file tailer + regex parser
│   │   │   └── motd.ts            # MOTD § color code parser
│   │   ├── db/
│   │   │   ├── schema.ts           # SQLite schema + migrations
│   │   │   ├── queries.ts          # Query helpers
│   │   │   └── index.ts            # DB connection singleton
│   │   ├── websocket/
│   │   │   └── server.ts           # WebSocket server setup
│   │   └── auth/
│   │       └── middleware.ts        # Auth helpers
│   ├── hooks/
│   │   ├── useServerStatus.ts      # WebSocket hook for live status
│   │   ├── useEventFeed.ts         # WebSocket hook for events
│   │   └── useRcon.ts              # Hook to send RCON commands
│   └── types/
│       └── minecraft.ts            # TypeScript types for all MC data
├── server/
│   └── ws-server.ts                # Standalone WebSocket server (if not integrated into Next.js)
└── data/
    └── craftboard.db               # SQLite database file (auto-created)
```

---

## Implementation Order

Build in this order so each step is independently testable:

1. **Project setup** — Initialize Next.js + TypeScript + Tailwind. Set up env config.
2. **RCON client** (`lib/minecraft/rcon.ts`) — Wrap `rcon-client`. Test with a simple API route that sends `list` and `tps`. Verify it connects on `127.0.0.1:25575`.
3. **Config reader** (`lib/minecraft/config-reader.ts`) — Parse `server.properties` at `MC_PROPERTIES_PATH`. Handle Java `.properties` escaping (`\#` → `#`). Test reading MOTD, max-players, difficulty.
4. **SQLite setup** (`lib/db/`) — Create schema, migration on startup.
5. **Log parser** (`lib/minecraft/log-parser.ts`) — Tail log file at `MC_LOG_PATH`, parse events, write to SQLite. Verify the dashboard user has read access to the file.
6. **API routes** — All REST endpoints.
7. **WebSocket server** — Real-time push of status, events, metrics.
8. **Dashboard layout** — Sidebar, header, responsive grid.
9. **Server Status Card** — Hero component with live RCON data.
10. **Online Players Panel** — Player list with avatars and actions.
11. **Event Feed** — Real-time scrolling log.
12. **Performance Charts** — TPS, player count, memory graphs.
13. **Console Terminal** — RCON command interface.
14. **Whitelist Manager** — CRUD whitelist operations.
15. **Quick Actions** — One-click server commands.
16. **Player History pages** — `/players` and `/players/[username]`.
17. **Authentication** — Login page + middleware.
18. **Polish** — Animations, loading states, error handling, mobile responsiveness.

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "rcon-client": "^4.2.0",
    "better-sqlite3": "^11.0.0",
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0",
    "recharts": "^2.12.0",
    "chokidar": "^3.6.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0"
  }
}
```

---

## Error Handling Requirements

- If the MC server is offline (RCON connection fails), show a clear "Server Offline" state on the dashboard (not a crash). Retry RCON connection every 5 seconds.
- If RCON connects but a specific command fails, show the error in context (e.g., in the console terminal) without crashing the dashboard.
- If `server.properties` is not readable, show a warning banner suggesting the user check file permissions (the dashboard runs as `kenei`, files are owned by `minecraft` — see File Permissions section).
- If log file is not found or not readable, show a warning banner suggesting the user check their `MC_LOG_PATH` config and file permissions.
- All RCON commands should have a timeout (5 seconds) and show the error to the admin.
- WebSocket should auto-reconnect with exponential backoff.
- SQLite writes should be wrapped in try/catch — never crash the dashboard over a DB write failure.

---

## Security Notes

- RCON password is stored only in `.env.local` — never exposed to the frontend.
- **RCON password escaping:** Minecraft's `server.properties` uses Java `.properties` escaping (e.g., `\#` in the file means `#` as the actual value). The `.env.local` password should contain the **actual** password (e.g., `MyPassword#1`), not the escaped version from `server.properties`.
- All RCON commands go through the backend API — the frontend never connects to RCON directly.
- The console interface should sanitize commands to prevent injection (though RCON is inherently a trusted channel).
- Rate-limit the RCON API endpoint to prevent accidental command flooding.
- Dashboard should only be accessible on the local network by default (bind to `0.0.0.0` but recommend firewall rules in docs).
- The dashboard reads `server.properties` as read-only — it never modifies Minecraft server files.

---

## Nice-to-Have (Future Enhancements)

- **World map** — Integrate with Dynmap/BlueMap/Squaremap if installed, embed the map iframe.
- **Backup management** — Trigger and list world backups.
- **Plugin manager** — List installed plugins, view plugin status.
- **Discord webhook** — Push events (joins, deaths, advancements) to a Discord channel.
- **Multi-server support** — Manage multiple MC servers from one dashboard.
- **Mobile PWA** — Add a service worker so it works as a mobile app.