# CraftBoard - Minecraft Server Dashboard

A self-hosted, real-time Minecraft server monitoring and management dashboard for Paper 1.21.1 servers. Connects via RCON for server data and commands, and tails the server log for real-time events.

## Features

- **Real-time Server Status**: Online/offline indicator, MOTD, version, player count, TPS
- **Online Players Panel**: Live player list with session duration and quick actions (kick, ban, teleport, message)
- **Activity Feed**: Real-time event stream (joins, leaves, deaths, advancements, chat, warnings, errors)
- **Performance Charts**: TPS and player count graphs over time (1h, 6h, 24h, 7d)
- **Console Terminal**: Send RCON commands with autocomplete and command history
- **Whitelist Manager**: Add/remove players from whitelist
- **Quick Actions**: Weather, time, difficulty controls, broadcast messages, save-all
- **Player History**: Full session history and statistics for all players

## Prerequisites

- Node.js 18+
- Paper Minecraft Server with RCON enabled
- Read access to server.properties and logs/latest.log

## Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd minecraft-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.local.example` to `.env.local` and configure:
```env
# Minecraft server connection
MC_SERVER_HOST=127.0.0.1
MC_RCON_PORT=25575
MC_RCON_PASSWORD=your_rcon_password

# Paths to Minecraft server files
MC_SERVER_DIR=/opt/minecraft
MC_LOG_PATH=/opt/minecraft/logs/latest.log
MC_STATS_PATH=/opt/minecraft/world/stats
MC_PROPERTIES_PATH=/opt/minecraft/server.properties

# Dashboard settings
DASHBOARD_PORT=3000
WS_PORT=3001

# Public WebSocket URL for frontend
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Basic auth (optional)
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=changeme
```

4. Set up file permissions (if server runs as a different user):
```bash
# Add your user to the minecraft group
sudo usermod -aG minecraft $USER

# Ensure group read on relevant directories
sudo chmod g+rx /opt/minecraft
sudo chmod g+r /opt/minecraft/server.properties
sudo chmod -R g+rX /opt/minecraft/logs

# Log out and back in for group membership to take effect
```

## Running

### Development

Run both the Next.js dev server and WebSocket server:
```bash
npm run dev:all
```

Or run them separately:
```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: WebSocket server
npm run ws
```

### Production

Build and start:
```bash
npm run build
npm start

# In a separate terminal:
npm run ws
```

Access the dashboard at http://localhost:3000

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4 with custom "Nether Command Center" dark theme
- **Real-time**: Socket.IO WebSockets
- **Backend**: Next.js API routes + standalone WebSocket server
- **Database**: SQLite (better-sqlite3) for player sessions, events, and metrics
- **RCON**: rcon-client package
- **Charts**: Recharts

## Project Structure

```
src/
├── app/
│   ├── api/         # API routes (status, players, events, rcon, etc.)
│   ├── console/     # Full-screen console page
│   ├── players/     # Player history pages
│   └── settings/    # Settings page
├── components/
│   ├── dashboard/   # Dashboard components
│   ├── layout/      # Sidebar, Header, MobileNav
│   └── ui/          # Reusable UI components
├── hooks/           # React hooks (useServerStatus, useRcon)
├── lib/
│   ├── db/          # SQLite database
│   └── minecraft/   # RCON, config reader, log parser
└── types/           # TypeScript types
server/
└── ws-server.ts     # WebSocket server
data/
└── craftboard.db    # SQLite database (auto-created)
```

## Environment Notes

- RCON must be enabled in server.properties
- Port 25565 is NOT used - all data comes from RCON (25575) and file reads
- The dashboard never writes to Minecraft server files
