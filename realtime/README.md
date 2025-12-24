# NextDesk Realtime Server

WebSocket server powered by [Yjs](https://github.com/yjs/yjs) for real-time collaborative editing.

## Setup

```bash
npm install
cp .env.example .env
npm run build  # Compile TypeScript
npm start
```

For development with auto-reload:

```bash
npm run dev
```

Server runs on `http://localhost:1234`.

## Configuration

Edit `.env`:

| Variable                | Default                 | Description                     |
| ----------------------- | ----------------------- | ------------------------------- |
| `PORT`                  | `1234`                  | Server port                     |
| `HOST`                  | `0.0.0.0`               | Server host                     |
| `CORS_ORIGINS`          | `http://localhost:3000` | Comma-separated allowed origins |
| `LOG_LEVEL`             | `info`                  | error/warn/info/debug           |
| `ROOM_CLEANUP_INTERVAL` | `300000`                | Cleanup interval (ms)           |
| `ROOM_INACTIVE_TIMEOUT` | `3600000`               | Inactive room timeout (ms)      |

## API

### WebSocket

```
ws://localhost:1234/{roomId}
```

### Health Check

```bash
GET /health
```

Returns server status and uptime.

### Metrics

```bash
GET /metrics
```

Returns room statistics.

## Architecture

- **Room Lifecycle**: Created on first connection, cleaned up after 1 hour of inactivity
- **Graceful Shutdown**: Handles SIGTERM/SIGINT with 10s timeout
- **Logging**: Structured JSON logs with configurable levels

## Troubleshooting

**Connection issues:**

```bash
curl http://localhost:1234/health
```

**Enable debug logs:**

```bash
LOG_LEVEL=debug npm start
```
