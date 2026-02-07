# Fix Missing .env.example

## Problem
```
.env.example not found. Please create apps/api/.env manually.
```

The setup script is looking for `.env.example` but it doesn't exist.

## Quick Fix

### Option 1: Create .env Manually

```bash
# Create .env file
nano apps/api/.env
```

Add this content (replace with your actual values):

```env
# Database (Docker)
DATABASE_URL="postgresql://league_voice:league_voice_dev@localhost:5432/league_voice?schema=public"

# Redis (Docker)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d

# Riot API - GET FROM https://developer.riotgames.com/
RIOT_CLIENT_ID=your-riot-client-id-here
RIOT_CLIENT_SECRET=your-riot-client-secret-here
RIOT_API_KEY=your-riot-api-key-here
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:1420

# LiveKit (Docker)
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=http://localhost:7880

# Server
PORT=4000
FRONTEND_URL=http://localhost:3000

# Encryption
ENCRYPTION_KEY=dev-key-change-in-production
```

Save and exit (Ctrl+X, then Y, then Enter).

### Option 2: Create .env.example First

```bash
# Create .env.example from the template above
# Then the script will copy it to .env
```

## After Creating .env

Continue with setup:

```bash
# If Docker permissions are fixed, continue setup
./setup-linux.sh

# Or manually start Docker services
cd infra
docker compose up -d
cd ..

# Then continue with database setup
cd apps/api
npm run prisma:generate
npm run prisma:migrate
cd ../..
```

## Get Riot API Credentials

1. Go to: https://developer.riotgames.com/
2. Create an application
3. Get:
   - Client ID
   - Client Secret
   - API Key
4. Add them to `apps/api/.env`
