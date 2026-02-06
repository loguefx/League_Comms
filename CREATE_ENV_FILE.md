# How to Create Your .env File

## Quick Setup

Your `.env` file is empty. Here's how to fill it with all the required configuration.

## Step 1: Open the .env File

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

## Step 2: Copy This Template

Paste this entire content into your `.env` file:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
# For SQLite (no Docker needed)
DATABASE_URL="file:./dev.db"

# For PostgreSQL (if using Docker)
# DATABASE_URL="postgresql://league_voice:league_voice_dev@localhost:5432/league_voice?schema=public"

# ============================================
# REDIS CONFIGURATION
# ============================================
# Set to 'false' to use in-memory (no Redis needed)
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
# Get these from: https://developer.riotgames.com/
# 1. Create an application
# 2. Add redirect URI: http://localhost:4000/auth/riot/callback
# 3. Copy your credentials below
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
```

## Step 3: Add Your Riot API Credentials

**IMPORTANT**: You need to replace these 3 values with your actual Riot credentials:

1. Go to: **https://developer.riotgames.com/**
2. Sign in with your Riot account
3. Create a new application
4. Add redirect URI: `http://localhost:4000/auth/riot/callback`
5. Copy and paste:
   - `RIOT_CLIENT_ID` - Your Client ID
   - `RIOT_CLIENT_SECRET` - Your Client Secret
   - `RIOT_API_KEY` - Your API Key (Development key works for testing)

Replace these lines:
```env
RIOT_CLIENT_ID=your-riot-client-id-here
RIOT_CLIENT_SECRET=your-riot-client-secret-here
RIOT_API_KEY=your-riot-api-key-here
```

With your actual values:
```env
RIOT_CLIENT_ID=abc123xyz789
RIOT_CLIENT_SECRET=secret_key_here
RIOT_API_KEY=RGAPI-12345678-90ab-cdef-ghij-klmnopqrstuv
```

## Step 4: Save the File

**In nano (Linux):**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

**In notepad (Windows):**
- Press `Ctrl + S`
- Close the window

## Step 5: Verify the File

**On Linux:**
```bash
cat .env
```

**On Windows:**
```powershell
type .env
```

You should see all the configuration values.

## Configuration Explained

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `DATABASE_URL` | Database connection string | ✅ Yes |
| `USE_REDIS` | Use Redis or in-memory cache | Optional (set to `false` for no Docker) |
| `JWT_SECRET` | Secret for signing JWT tokens | ✅ Yes |
| `RIOT_CLIENT_ID` | Riot OAuth Client ID | ✅ Yes (for Riot auth) |
| `RIOT_CLIENT_SECRET` | Riot OAuth Client Secret | ✅ Yes (for Riot auth) |
| `RIOT_API_KEY` | Riot API Key | ✅ Yes (for match data) |
| `LIVEKIT_API_KEY` | LiveKit voice server key | Optional (for voice) |
| `ENCRYPTION_KEY` | Key for encrypting tokens | ✅ Yes |

## Quick Start (Without Riot API)

If you just want to test the app without Riot API first:

1. Use the template above
2. Leave the Riot credentials as placeholders
3. The app will start, but Riot features won't work until you add real credentials

## Next Steps

After creating your `.env` file:

1. ✅ Add your Riot API credentials (see `RIOT_API_SETUP.md` for details)
2. ✅ Run `npm run prisma:generate` to generate Prisma client
3. ✅ Run `npm run prisma:migrate` to create the database
4. ✅ Start the app with `npm run dev`

## Troubleshooting

### "Cannot find module" errors
- Make sure you're in the `apps/api` directory when editing `.env`

### "Invalid credentials" errors
- Check that your Riot API credentials are correct
- Make sure there are no extra spaces or quotes around values

### Database errors
- If using SQLite, make sure `DATABASE_URL="file:./dev.db"`
- If using PostgreSQL, make sure Docker is running and the database is up
