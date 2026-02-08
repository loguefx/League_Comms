# Fix 401 API Errors

## The Problem

You're getting `401 Unauthorized` errors when trying to fetch data from Riot API:
```
Status: 401
Failed to get league entries: 401
Failed to get challenger league: 401
```

This means your API key is either:
1. **Not set correctly** in the `.env` file
2. **Expired** (development keys expire after 24 hours)
3. **Invalid** or doesn't have the right permissions

## Solution

### Step 1: Verify API Key is Set

Check your `.env` file:

```bash
cd ~/League_Comms/apps/api
cat .env | grep RIOT_API_KEY
```

It should show something like:
```
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**NOT:**
```
RIOT_API_KEY=your-riot-api-key-here
```

### Step 2: Get a New API Key

If your key is expired or invalid:

1. Go to: https://developer.riotgames.com/
2. Log in to your Riot account
3. Go to "My Apps" or "API Keys"
4. Create a new application or regenerate your API key
5. Copy the new key (starts with `RGAPI-`)

### Step 3: Update .env File

```bash
cd ~/League_Comms/apps/api
nano .env
```

Find the line:
```
RIOT_API_KEY=your-old-key-here
```

Replace with:
```
RIOT_API_KEY=RGAPI-your-new-key-here
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Restart API Server

**Important:** You MUST restart the server for the new API key to be loaded:

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd ~/League_Comms
npm run dev
```

### Step 5: Verify API Key is Loaded

Check the server logs when it starts. You should see:
```
✅ API Key loaded: RGAPI-xxxx...
```

If you see:
```
❌ RIOT_API_KEY is missing from environment variables!
```

Then the API key isn't being loaded correctly.

### Step 6: Test the API Key

After restarting, trigger batch seeding again:

```bash
curl -X POST "http://192.168.0.159:4000/champions/seed/batch?region=na1"
```

Check the logs - you should see:
- ✅ No more 401 errors
- ✅ "Found X players in IRON I"
- ✅ "Player X: Found Y matches"
- ✅ "Ingested Z unique matches total"

## Common Issues

### Issue 1: API Key Not Reloaded

**Symptom:** Updated `.env` but still getting 401 errors

**Fix:** Restart the API server. Environment variables are only loaded when the server starts.

### Issue 2: Development Key Expired

**Symptom:** Key worked yesterday but not today

**Fix:** Development keys expire after 24 hours. Get a new one from Riot Developer Portal.

### Issue 3: Wrong API Key Format

**Symptom:** Key doesn't start with `RGAPI-`

**Fix:** Make sure you copied the full key from Riot Developer Portal. It should start with `RGAPI-`.

### Issue 4: API Key Has Wrong Permissions

**Symptom:** Some endpoints work, others return 401

**Fix:** Make sure your Riot application has access to:
- League-V4 API
- Summoner-V4 API  
- Match-V5 API

## Verify It's Working

Once the API key is correct, you should see in the logs:

```
✅ API Key loaded: RGAPI-xxxx...
LOG [BatchSeedService] Found 50 players in IRON I
LOG [BatchSeedService] Player PlayerName: Found 100 matches
LOG [BatchSeedService] Ingested 1234 unique matches total
```

And no more 401 errors!
