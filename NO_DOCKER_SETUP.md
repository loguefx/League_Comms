# Setup Without Docker

This guide helps you run the League Voice Companion without Docker.

## Quick Start

Run the no-Docker setup script:

```powershell
.\setup-windows-no-docker.ps1
```

## What Changes

### Database: PostgreSQL → SQLite
- **Before:** PostgreSQL in Docker container
- **Now:** SQLite file (`apps/api/prisma/dev.db`)
- **Pros:** No installation needed, works immediately
- **Cons:** Less features, not suitable for production

### Redis: Redis Server → In-Memory
- **Before:** Redis server in Docker
- **Now:** In-memory cache (lost on restart)
- **Pros:** No installation needed
- **Cons:** Not persistent, limited features

### LiveKit: Docker → Optional
- **Before:** LiveKit server in Docker
- **Now:** Can skip or use cloud instance
- **Note:** Voice features may not work without LiveKit

## Manual Setup Steps

### 1. Run the Setup Script

```powershell
.\setup-windows-no-docker.ps1
```

### 2. Configure Environment

Edit `apps/api/.env` and add your Riot API credentials:

```env
RIOT_CLIENT_ID=your-client-id
RIOT_CLIENT_SECRET=your-client-secret
RIOT_API_KEY=your-api-key
```

### 3. Use SQLite Schema

The script will automatically use SQLite. If you need to switch manually:

```powershell
cd apps\api
Copy-Item prisma\schema.sqlite.prisma prisma\schema.prisma
npm run prisma:generate
npm run prisma:migrate
```

### 4. Disable Redis (Optional)

In `apps/api/.env`, add:

```env
USE_REDIS=false
```

This will use the in-memory fallback.

### 5. Start Development

```powershell
npm run dev
```

## Limitations

1. **SQLite:**
   - No concurrent writes (fine for development)
   - Limited JSON support (stored as strings)
   - Not suitable for production scale

2. **In-Memory Redis:**
   - Cache is lost on server restart
   - Rate limiting may not work perfectly
   - No distributed caching

3. **LiveKit:**
   - Voice features won't work without LiveKit
   - Can use cloud LiveKit instance later

## When to Use Docker

- Production deployment
- Need persistent Redis cache
- Need PostgreSQL features
- Want voice features to work
- Multiple developers

## When No-Docker is OK

- Quick local development
- Testing basic features
- Learning the codebase
- Docker installation issues

## Switching Back to Docker

If you fix Docker later:

1. Restore PostgreSQL schema:
   ```powershell
   cd apps\api
   # Restore original schema.prisma
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://league_voice:league_voice_dev@localhost:5432/league_voice"
   USE_REDIS=true
   ```

3. Start Docker:
   ```powershell
   cd infra
   docker-compose up -d
   ```

4. Run migrations:
   ```powershell
   cd apps\api
   npm run prisma:migrate
   ```
