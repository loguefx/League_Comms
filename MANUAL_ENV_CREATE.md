# Manual .env File Creation (If Script Doesn't Work)

## Quick Manual Method

If `npm run create-env` doesn't create the file, create it manually:

### Step 1: Navigate to apps/api

```bash
cd ~/League_Comms/apps/api
```

### Step 2: Create the file

```bash
cat > .env << 'EOF'
# ============================================
# DATABASE CONFIGURATION
# ============================================
# SQLite (no Docker needed) - Default for development
DATABASE_URL="file:./dev.db"

# ============================================
# REDIS CONFIGURATION
# ============================================
# Set to 'false' to use in-memory cache (no Docker needed)
USE_REDIS=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d

# ============================================
# RIOT API CREDENTIALS
# ============================================
# IMPORTANT: Get these from https://developer.riotgames.com/
RIOT_CLIENT_ID=your-riot-client-id-here
RIOT_CLIENT_SECRET=your-riot-client-secret-here
RIOT_API_KEY=your-riot-api-key-here
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback

# ============================================
# CORS CONFIGURATION
# ============================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:1420

# ============================================
# LIVEKIT VOICE SERVER
# ============================================
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=http://localhost:7880

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=4000
FRONTEND_URL=http://localhost:3000

# ============================================
# ENCRYPTION
# ============================================
ENCRYPTION_KEY=dev-key-change-in-production
EOF
```

### Step 3: Verify it was created

```bash
ls -la .env
cat .env
```

You should see the file and its contents.

## Alternative: Using nano

```bash
cd ~/League_Comms/apps/api
nano .env
```

Then paste the content above, save with `Ctrl+X`, `Y`, `Enter`.

## Troubleshooting

### Check if file exists but is hidden

```bash
cd ~/League_Comms/apps/api
ls -la | grep env
```

Files starting with `.` are hidden by default. Use `ls -la` to see them.

### Check permissions

```bash
cd ~/League_Comms/apps/api
touch .env
ls -la .env
```

If you can create an empty file, you have write permissions.

### Run script with verbose output

```bash
cd ~/League_Comms
node scripts/create-env.js
```

This will show detailed output about what the script is doing.
