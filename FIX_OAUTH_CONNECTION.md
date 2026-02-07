# Fix OAuth Connection Issue

## The Problem

You're seeing "An error occurred! Please try again later" from Riot because:
- **Redirect URI not registered**: `http://192.168.0.159:4000/auth/riot/callback` is not registered in Riot Developer Portal
- Riot rejects OAuth requests with unregistered redirect URIs

## Solution 1: Try localhost (EASIEST - Works for Development)

Many OAuth providers allow `localhost` redirect URIs without registration. Let's try this first:

### Step 1: Update `.env` File

Edit `apps/api/.env` and change:

```env
# FROM:
RIOT_REDIRECT_URI=http://192.168.0.159:4000/auth/riot/callback
FRONTEND_URL=http://192.168.0.159:3000

# TO:
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback
FRONTEND_URL=http://localhost:3000
```

### Step 2: Restart API Server

```bash
# Stop the API server (Ctrl+C)
# Then restart it
cd apps/api
npm run dev
```

### Step 3: Access from localhost

- **Frontend**: `http://localhost:3000`
- **API**: `http://localhost:4000`

### Step 4: Try Connecting Again

Go to Settings → Connect Riot Account

**If this works**: Great! You can use localhost for development.

**If this doesn't work**: Continue to Solution 2.

## Solution 2: Contact Riot Support (REQUIRED for Production)

Since we can't find where to register redirect URIs in the portal, you need to contact Riot Support:

### Step 1: Go to Riot Support

1. Go to: `https://developer.riotgames.com/support`
2. Or click "SUPPORT" in the top navigation

### Step 2: Submit Request

**Subject**: "Need to register OAuth Redirect URI for Client ID 795190"

**Message** (copy and paste):

```
Hello Riot Support,

I have an OAuth Application with Client ID: 795190
Product ID: 729699

I need to register an OAuth Redirect URI for my application:
http://192.168.0.159:4000/auth/riot/callback

I cannot find where to manage OAuth Redirect URIs in the Developer Portal. 
All standard OAuth URLs give 404 errors.

Could you please:
1. Tell me where to find OAuth Redirect URI settings, OR
2. Add this redirect URI to my OAuth application (Client ID: 795190)

Thank you!
```

### Step 3: Wait for Response

Riot Support should respond within 1-3 business days.

## Solution 3: Check API Server Logs

When you try to connect, check your API server console for detailed error messages:

### What to Look For

1. **When clicking "Connect Riot Account"**, you should see:
   ```
   🔐 Generated OAuth URL: https://auth.riotgames.com/oauth2/authorize?...
   Redirect URI: http://192.168.0.159:4000/auth/riot/callback
   Client ID: 795190
   ```

2. **When Riot redirects back**, you should see:
   ```
   === OAuth Callback Received ===
   Full URL: /auth/riot/callback?error=...
   Has error: true
   Error: [error code]
   ```

3. **Common errors**:
   - `redirect_uri_mismatch` = Redirect URI not registered
   - `invalid_client` = Client ID/Secret wrong
   - `access_denied` = User cancelled or Riot rejected

### Check Logs Now

1. Make sure your API server is running
2. Try connecting your Riot account
3. **Copy the full console output** and share it

## Solution 4: Verify Your Credentials

Make sure your `apps/api/.env` has correct values:

```env
RIOT_CLIENT_ID=795190
RIOT_CLIENT_SECRET=your-actual-client-secret-here
RIOT_REDIRECT_URI=http://192.168.0.159:4000/auth/riot/callback
RIOT_API_KEY=your-api-key-here
FRONTEND_URL=http://192.168.0.159:3000
```

### Test Your Configuration

Visit these URLs to verify:

1. **Check Config**: `http://192.168.0.159:4000/auth/riot/test/config`
   - Should show all values are "Configured"

2. **Test API Key**: `http://192.168.0.159:4000/auth/riot/test/api-key`
   - Should show "Riot API Key is working!"

## Quick Checklist

- [ ] Try localhost redirect URI first (Solution 1)
- [ ] Check API server logs for detailed errors
- [ ] Verify `.env` file has correct credentials
- [ ] Test configuration endpoints
- [ ] Contact Riot Support if localhost doesn't work

## Most Likely Fix

**Try Solution 1 (localhost) first** - it's the quickest and works for development. If you need to access from other machines, you'll need to contact Riot Support to register your IP-based redirect URI.
