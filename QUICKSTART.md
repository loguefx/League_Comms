# Quick Start Guide

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Rust (for Tauri desktop app)
- Riot Developer Portal account (for API keys)

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start infrastructure:**
```bash
cd infra
docker-compose up -d
```

3. **Set up environment variables:**
```bash
cd apps/api
cp .env.example .env
# Edit .env with your Riot API credentials
```

4. **Run database migrations:**
```bash
cd apps/api
npm run prisma:generate
npm run prisma:migrate
```

5. **Start development servers:**
```bash
# From root directory
npm run dev
```

This will start:
- API server on http://localhost:4000
- Web app on http://localhost:3000
- Desktop app (via Tauri)

## Riot API Setup

1. Register your app at https://developer.riotgames.com/
2. Get your API key and OAuth client credentials
3. Configure redirect URIs:
   - Web: `http://localhost:3000/auth/callback`
   - API: `http://localhost:4000/auth/riot/callback`
4. Add credentials to `apps/api/.env`

## Project Structure

- `apps/api/` - NestJS backend with Fastify
- `apps/web/` - Next.js web application
- `apps/desktop/` - Tauri desktop app
- `apps/voice/` - LiveKit voice server config
- `packages/shared/` - Shared types and constants
- `packages/ui/` - Shared React components
- `packages/riot/` - Riot API client wrapper

## Key Features Implemented

✅ Riot RSO OAuth authentication
✅ Live game detection with polling
✅ Voice rooms with LiveKit
✅ Player stats and match history
✅ Champion analytics by rank/role
✅ Rate limiting and error handling
✅ Riot API compliance verification

## Next Steps

1. Test Riot OAuth flow by visiting `/settings` in the web app
2. Enable auto-join voice in settings
3. Start a League game to test live detection
4. View your stats at `/profile`
5. Check analytics at `/analytics`

## Important Notes

- All Riot API calls go through the `@league-voice/riot` package
- Tokens are encrypted at rest
- Rate limiting is enforced per user and per IP
- No memory reading, client injection, or traffic interception
- All data comes from Riot-supported APIs only
