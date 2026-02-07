# Getting the API Working - Step by Step

## Quick Start Checklist

### Step 1: Verify Prerequisites

```bash
# Check Node.js version (need 18+)
node --version

# Check if you're in the right directory
pwd  # Should be in League_Comms or League_Voice_comm
```

### Step 2: Install Dependencies

```bash
# From project root
npm install

# Build shared packages first
cd packages/shared
npm run build
cd ../riot
npm run build
cd ../..
```

### Step 3: Set Up Environment

```bash
# Create .env file if it doesn't exist
cd apps/api
npm run create-env  # Or manually create apps/api/.env

# Edit apps/api/.env and add your Riot credentials:
# - RIOT_CLIENT_ID
# - RIOT_CLIENT_SECRET  
# - RIOT_API_KEY
# - RIOT_REDIRECT_URI
```

### Step 4: Set Up Database

**Option A: SQLite (Quick Start)**
```bash
cd apps/api
npm run prisma:generate
npm run prisma:migrate
```

**Option B: PostgreSQL (Production)**
```bash
# Start PostgreSQL
cd infra
docker-compose up -d postgres

# Update .env to use PostgreSQL
# Then run migrations
cd ../apps/api
npm run prisma:generate
npm run prisma:migrate
```

### Step 5: Build API

```bash
cd apps/api
npm run build
```

### Step 6: Start API

```bash
cd apps/api
npm run dev
```

You should see:
```
🚀 API server running on http://localhost:4000
```

### Step 7: Test API Endpoints

**Health Check:**
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok","timestamp":"..."}
```

**Test Configuration:**
```bash
curl http://localhost:4000/auth/riot/test/config
# Should show your configuration (without secrets)
```

**Test API Key:**
```bash
curl http://localhost:4000/auth/riot/test/api-key
# Should confirm API key is set
```

## Common Issues & Fixes

### Issue 1: "Cannot find module" errors

**Fix:**
```bash
# Rebuild shared packages
cd packages/shared && npm run build
cd ../riot && npm run build
cd ../../apps/api && npm run build
```

### Issue 2: "Prisma Client not initialized"

**Fix:**
```bash
cd apps/api
npm run prisma:generate
npm run prisma:migrate
```

### Issue 3: "Port 4000 already in use"

**Fix:**
```bash
# Find and kill process on port 4000
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux:
lsof -ti:4000 | xargs kill
```

### Issue 4: Database connection errors

**For SQLite:**
- Make sure `apps/api/dev.db` file can be created
- Check file permissions

**For PostgreSQL:**
- Verify Docker is running: `docker ps`
- Check connection string in `.env`
- Test connection: `docker exec -it league-voice-postgres psql -U league_voice -d league_voice`

### Issue 5: OAuth "Missing authorization code"

**This means:**
1. Redirect URI not registered in Riot Developer Portal
2. OR Riot is redirecting with an error instead of code

**Fix:**
1. Go to https://developer.riotgames.com/
2. Add redirect URI: `http://192.168.0.159:4000/auth/riot/callback`
3. Wait 1-2 minutes
4. Try again

## Verification Steps

### 1. API Server Running
```bash
curl http://localhost:4000/health
```

### 2. Database Connected
Check API logs for Prisma connection messages

### 3. Configuration Valid
```bash
curl http://localhost:4000/auth/riot/test/config
```

### 4. OAuth Flow
1. Visit: `http://192.168.0.159:4000/auth/riot/start`
2. Should redirect to Riot login
3. After login, should redirect back with code
4. Check API logs for OAuth callback processing

## API Endpoints Reference

### Public Endpoints
- `GET /health` - Health check
- `GET /auth/riot/test/config` - Test configuration
- `GET /auth/riot/test/api-key` - Test API key
- `GET /auth/riot/start` - Start OAuth flow
- `GET /auth/riot/callback` - OAuth callback (handled by Riot)

### Protected Endpoints (Require JWT Token)
- `GET /auth/riot/status` - Get Riot account status
- `GET /stats/match-history` - Get match history
- `GET /stats/profile` - Get user profile
- `POST /game/start-polling` - Start game detection
- `POST /voice/token` - Get voice room token

## Next Steps After API Works

1. ✅ Test health endpoint
2. ✅ Test configuration endpoint
3. ✅ Test OAuth flow
4. ✅ Link Riot account
5. ✅ Test protected endpoints

## Debugging Tips

### Enable Verbose Logging

The API already logs:
- OAuth callback processing
- Token exchange
- Account info retrieval
- Session creation

Watch your API console for these messages.

### Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try connecting Riot account
4. Look for:
   - `/auth/riot/start` - Should redirect to Riot
   - `/auth/riot/callback` - Should have `code` parameter
   - `/auth/callback` - Should have `token` parameter

### Check API Logs

Look for:
- `🚀 API server running on http://localhost:4000`
- `Processing OAuth callback with code: ...`
- `Tokens received, expires in: ...`
- `Account info received: ...`
- `Session created successfully`

Any errors will show detailed information.
