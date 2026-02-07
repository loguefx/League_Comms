# Complete Fix for Setup Issues

## Issues Found
1. ❌ Docker permission denied
2. ❌ Missing `.env.example` file

## Fix Both Issues

### Step 1: Fix Docker Permissions

```bash
# Add yourself to docker group
sudo usermod -aG docker $USER

# Activate docker group
newgrp docker

# Verify Docker works
docker ps
```

### Step 2: Create .env File

```bash
# Create .env file
nano apps/api/.env
```

Paste this content (you'll add Riot credentials later):

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

Save (Ctrl+X, Y, Enter).

### Step 3: Start Docker Services Manually

```bash
# Start Docker services
cd infra
docker compose up -d
cd ..
```

### Step 4: Set Up Database

```bash
# Generate Prisma client
cd apps/api
npm run prisma:generate

# Run migrations
npm run prisma:migrate
cd ../..
```

### Step 5: Build Packages

```bash
# Build shared packages
npm run build
```

### Step 6: Add Riot API Credentials

```bash
# Edit .env with your Riot credentials
nano apps/api/.env
```

Get credentials from: https://developer.riotgames.com/

### Step 7: Start Development

```bash
npm run dev
```

## Quick Command Sequence

```bash
# 1. Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker
docker ps  # Verify

# 2. Create .env (copy content from above)
nano apps/api/.env

# 3. Start Docker
cd infra && docker compose up -d && cd ..

# 4. Setup database
cd apps/api && npm run prisma:generate && npm run prisma:migrate && cd ../..

# 5. Build
npm run build

# 6. Add Riot credentials
nano apps/api/.env

# 7. Start dev
npm run dev
```

## Verify Everything Works

```bash
# Check Docker containers
docker ps

# Check API health
curl http://localhost:4000/health

# Open web app
xdg-open http://localhost:3000
```
