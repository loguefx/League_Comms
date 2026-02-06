# Create .env File Now

## The .env file is missing. Here's how to create it:

### Step 1: Make sure you're in the project root

```bash
cd ~/League_Comms
```

### Step 2: Run the create-env script

```bash
npm run create-env
```

This will create `apps/api/.env` with all default values.

### Step 3: Verify it was created

```bash
ls -la apps/api/.env
```

You should see the file listed.

### Step 4: View the file

```bash
cat apps/api/.env
```

You should see all the environment variables with placeholder values.

### Step 5: Edit with your Riot API credentials

```bash
nano apps/api/.env
```

Find these lines and replace with your actual credentials:
```env
RIOT_CLIENT_ID=your-actual-client-id
RIOT_CLIENT_SECRET=your-actual-client-secret
RIOT_API_KEY=your-actual-api-key
```

## If the script doesn't work

If `npm run create-env` fails, you can create it manually:

```bash
cd ~/League_Comms/apps/api
nano .env
```

Then paste this content:

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

Save with `Ctrl+X`, then `Y`, then `Enter`.

## Quick Command Sequence

```bash
# 1. Go to project root
cd ~/League_Comms

# 2. Create .env
npm run create-env

# 3. Verify
ls apps/api/.env

# 4. Edit with your credentials
nano apps/api/.env
```
