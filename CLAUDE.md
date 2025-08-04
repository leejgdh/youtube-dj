# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
```bash
# Start Next.js development server
npm run dev

# Start Socket.IO server separately  
npm run dev:socket

# Start both servers concurrently
npm run dev:all

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Docker Development
```bash
# Local build and run
docker-compose up -d

# Production image deployment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Architecture Overview

### Dual Server Architecture
This application runs two separate servers:
- **Next.js App Server** (port 3000 → 8800): Serves the web application and API routes
- **Socket.IO Server** (port 3001 → 8801): Handles real-time communication and playlist state

### Real-Time State Management
- **Server Authority**: Socket.IO server (`socket-server.js`) maintains authoritative playlist state
- **Client Synchronization**: All clients receive real-time updates via Socket.IO events
- **State Persistence**: Playlist and playback state persist across page refreshes
- **Multi-Client Support**: Multiple users can request songs; all see synchronized playback

### Key Socket.IO Events
- `request-song`: New song requests with metadata extraction
- `play-next-song`: Advance to next song in playlist
- `skip-to-song`: Jump to specific song by index
- `update-play-state`: Sync play/pause state across clients
- `server-state`: Full state broadcast to new connections

### Component Data Flow
```
useSocket Hook → Server State → Components (VideoPlayer, Playlist)
     ↑                              ↓
Socket.IO Events ← YouTube Player Events
```

## Environment Configuration

The `.env` file controls deployment settings:
- `NEXT_PUBLIC_SOCKET_PORT`: Socket server external port (default: 8801)
- `WEB_PORT`/`SOCKET_PORT`: External port mappings for Docker
- `NEXT_PUBLIC_SOCKET_URL`: Optional fixed socket URL (auto-detects host IP if not set)
- Registry settings for production image deployment

**Automatic IP Detection**: Socket connection automatically uses the browser's current hostname and configured port. Only set `NEXT_PUBLIC_SOCKET_URL` if you need to override this behavior.

## Key Implementation Details

### YouTube Integration
- Uses `react-youtube` library for embedded player
- YouTube oEmbed API for metadata extraction (`/api/youtube` route)
- Auto-advance when songs end via YouTube player events

### State Synchronization Strategy
- **Client State**: React useState managed by `useSocket` hook
- **Server State**: In-memory playlist queue with current song tracking
- **Duplicate Prevention**: Set-based tracking prevents duplicate song processing
- **Connection Resilience**: Auto-reconnection with fallback transports

### Fullscreen Mode
- CSS-based fullscreen overlay with `position: fixed`
- Special fullscreen playlist component for horizontal scrolling
- YouTube player resizes to fit fullscreen container

### Request Flow
1. User submits YouTube URL on `/request` page
2. Client calls `/api/youtube` for metadata extraction
3. Client emits `request-song` via Socket.IO
4. Server broadcasts update to all connected clients
5. Clients update local state and UI

## Development Notes

- Socket.IO server includes test songs for development
- Two Docker configurations: local build vs pre-built registry images
- Material-UI theming with custom styling for video player
- TypeScript interfaces defined in `src/types/index.ts`
- All real-time logic centralized in `useSocket` hook