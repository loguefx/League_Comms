# Fix Your .env File - Two Critical Issues

## Issue 1: Client Secret is Still a Placeholder! ⚠️

Your `.env` shows:
```
RIOT_CLIENT_SECRET=your-riot-client-secret-here
```

**This is a placeholder!** You need your **actual** Client Secret from Riot.

## Issue 2: Redirect URI Should Use localhost

Change from IP address to localhost for development.

## How to Fix

### Step 1: Get Your Client Secret

You need to find your **actual Client Secret** from Riot Developer Portal. Since we couldn't find the OAuth settings in the portal, you have two options:

**Option A: Check if you saved it when you created the OAuth app**
- Look in your notes, email, or password manager
- Client Secret is usually shown **only once** when you create the app

**Option B: Contact Riot Support**
- Ask them for your Client Secret for Client ID `795190`
- Or ask them to regenerate it

### Step 2: Update Your .env File

In nano, make these changes:

1. **Change Client Secret** (line with `RIOT_CLIENT_SECRET`):
   ```
   RIOT_CLIENT_SECRET=your-actual-secret-here
   ```
   Replace `your-actual-secret-here` with the real secret from Riot.

2. **Change Redirect URI to localhost**:
   ```
   RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback
   ```

3. **Change Frontend URL to localhost**:
   ```
   FRONTEND_URL=http://localhost:3000
   ```

### Step 3: Save and Exit nano

1. Press `Ctrl + O` (Write Out / Save)
2. Press `Enter` to confirm filename
3. Press `Ctrl + X` (Exit)

### Step 4: Restart API Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd ~/League_Comms
npm run dev
```

## What Your .env Should Look Like

```env
RIOT_CLIENT_ID=795190
RIOT_CLIENT_SECRET=your-actual-secret-from-riot  # ← MUST BE REAL SECRET
RIOT_API_KEY=RGAPI-cdb29c26-9ff2-404c-ab3a-8dbec3bdb046
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback  # ← Changed to localhost
FRONTEND_URL=http://localhost:3000  # ← Changed to localhost
```

## If You Don't Have Client Secret

**Contact Riot Support immediately:**

1. Go to: `https://developer.riotgames.com/support`
2. Ask: "I need my Client Secret for OAuth Application with Client ID 795190. I cannot find it in the Developer Portal."

They can either:
- Give you the existing secret
- Regenerate a new one (you'll need to update `.env` with the new secret)

## Test After Fixing

1. **Check config**: `http://localhost:4000/auth/riot/test/config`
   - Should show `hasClientSecret: true`

2. **Test OAuth URL**: `http://localhost:4000/auth/riot/test/oauth-url`
   - Should show the OAuth URL with localhost redirect

3. **Try connecting**: `http://localhost:3000` → Settings → Connect Riot Account

## Why This Matters

- **Client Secret**: Required for OAuth token exchange. Without it, Riot will reject the request.
- **localhost Redirect URI**: Many OAuth providers allow this without registration, making development easier.
