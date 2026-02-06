# Quick .env File Setup

## Your .env file is empty. Here's how to fill it:

### Step 1: Open the file

**On Linux:**
```bash
cd ~/League_Comms/apps/api
nano .env
```

**On Windows:**
```powershell
cd apps\api
notepad .env
```

### Step 2: Copy and paste this entire content:

```env
# Database (SQLite - no Docker needed)
DATABASE_URL="file:./dev.db"

# Redis (set to false to use in-memory, no Docker needed)
USE_REDIS=false
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

# LiveKit (for voice - optional for now)
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=http://localhost:7880

# Server
PORT=4000
FRONTEND_URL=http://localhost:3000

# Encryption
ENCRYPTION_KEY=dev-key-change-in-production
```

### Step 3: Save

**In nano:** `Ctrl+X`, then `Y`, then `Enter`  
**In notepad:** `Ctrl+S`, then close

### Step 4: Add Riot API credentials (later)

For now, you can leave the Riot credentials as placeholders. The app will start, but Riot features won't work until you add real credentials from https://developer.riotgames.com/

See `RIOT_API_SETUP.md` for detailed instructions on getting Riot API credentials.

### Step 5: Test it

```bash
# Generate Prisma client
npm run prisma:generate

# Create database
npm run prisma:migrate

# Start the app
cd ~/League_Comms
npm run dev
```

That's it! Your `.env` file is now configured.
