# Quick Fix: Use localhost for OAuth (Development)

## The Problem

Riot is rejecting OAuth because `http://192.168.0.159:4000/auth/riot/callback` is not registered.

## Quick Solution: Use localhost

Many OAuth providers (including Riot) allow `localhost` redirect URIs **without registration** for development.

## Step-by-Step Fix

### Step 1: Update `.env` File

Edit `apps/api/.env`:

```env
# Change these two lines:
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback
FRONTEND_URL=http://localhost:3000
```

**Keep everything else the same!**

### Step 2: Restart API Server

```bash
# Stop the API server (Ctrl+C in the terminal)
# Then restart:
cd apps/api
npm run dev
```

### Step 3: Access from localhost

**Important**: You must access the app from `localhost`, not the IP address:

- ✅ **Frontend**: `http://localhost:3000`
- ✅ **API**: `http://localhost:4000`
- ❌ **Don't use**: `http://192.168.0.159:3000`

### Step 4: Try Connecting

1. Go to: `http://localhost:3000`
2. Go to Settings
3. Click "Connect Riot Account"
4. It should work now!

## Why This Works

- `localhost` redirect URIs are often allowed without registration
- This is standard for OAuth development
- You can still access from other machines later (after registering the IP)

## If localhost Doesn't Work

If you still get errors with localhost:

1. **Check API logs** - Look for the exact error message
2. **Test OAuth URL**: Visit `http://localhost:4000/auth/riot/test/oauth-url`
3. **Contact Riot Support** - They need to register your redirect URI

## For Production

When you're ready for production:
1. Use a domain name (not IP address)
2. Use HTTPS (required for production)
3. Register the redirect URI with Riot Support

## Test Your Setup

After changing to localhost, test:

1. **Config**: `http://localhost:4000/auth/riot/test/config`
   - Should show redirect URI as `http://localhost:4000/auth/riot/callback`

2. **OAuth URL**: `http://localhost:4000/auth/riot/test/oauth-url`
   - Should show the OAuth URL with localhost redirect

3. **Try connecting** from `http://localhost:3000`
