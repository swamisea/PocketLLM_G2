# Telemetry Overview

## What is captured
- **Cache events**: cache hit/miss for chat responses, including userId/sessionId, model, temperature, prompt/response length, duration.
- **Chat responses**: model invocations (cache miss path) with duration and sizes.
- **Chat errors**: failures during chat handling with error message and timing.

## Storage
- Collection: `telemetry`
- Fields: `eventType` (`cache_hit` | `cache_miss` | `chat_response` | `chat_error`), `userId`, `sessionId`, `model`, `temperature`, `cacheHit`, `durationMs`, `promptChars`, `responseChars`, `errorMessage`, `createdAt` (ISO).

## API
- `GET /api/telemetry?limit=50` — returns recent telemetry events (auth required). `limit` is optional (default 50).

## UI (at `/telemetry`)
- Auto-refreshes every 5s and shows the last checked timestamp.
- Cards: Total events / Chat responses / Cache hits / Errors.
- Cache block: Hit rate %, Hits vs Misses with progress bar.
- Averages: Duration (ms), Prompt length (chars), Response length (chars).
- Recent events list (latest 15): event type, model, timestamp (local time).
