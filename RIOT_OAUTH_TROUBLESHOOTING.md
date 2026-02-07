# Riot OAuth & API Connection Troubleshooting Guide

## Quick Diagnostic Steps

### 1. Test Your Configuration

Visit these endpoints to check your setup:

**Check Configuration (No Auth Required):**
```
GET http://192.168.0.159:4000/auth/riot/test/config
```

This will show:
- If Client ID is set
- If Client Secret is set
- What redirect URI is configured
- If API Key is set

**Test API Key:**
```
GET http://192.168.0.159:4000/auth/riot/test/api-key
```

### 2. Check Your `.env` File

Make sure `apps/api/.env` has all required values:

```env
# OAuth Credentials (from Riot Developer Portal → Your App → OAuth)
RIOT_CLIENT_ID=795190
RIOT_CLIENT_SECRET=your-actual-client-secret-here
RIOT_REDIRECT_URI=http://192.168.0.159:4000/auth/riot/callback

# API Key (from Riot Developer Portal → API Keys)
RIOT_API_KEY=RGAPI-your-api-key-here

# Frontend URL (for redirects)
FRONTEND_URL=http://192.168.0.159:3000
```

### 3. Verify Redirect URI in Riot Developer Portal

**CRITICAL:** The redirect URI must be registered in the Riot Developer Portal.

1. Go to https://developer.riotgames.com/
2. Navigate to **Applications** → **Your Application** (League Comm Companion)
3. Find **OAuth Redirect URIs** section
4. Make sure this EXACT URI is listed (case-sensitive, no trailing slash):
   ```
   http://192.168.0.159:4000/auth/riot/callback
   ```
5. If not listed, click **Add Redirect URI** and add it
6. **Save** changes
7. Wait 1-2 minutes for changes to propagate

### 4. Check API Server Logs

When you try to connect, check your API server console for:
- `Processing OAuth callback with code: ...`
- `Tokens received, expires in: ...`
- `Getting account info for region: ...`
- `Account info received: ...`
- `Session created successfully`

If you see errors, they will help identify the issue.

## Common Issues & Solutions

### Issue 1: "An error occurred! Please try again later" from Riot

**Cause:** Redirect URI not registered or doesn't match exactly

**Solution:**
1. Verify redirect URI in Riot Developer Portal matches exactly
2. Check for typos, trailing slashes, or case differences
3. Wait 1-2 minutes after adding redirect URI

### Issue 2: "Missing authorization code"

**Cause:** Riot didn't redirect back with a code

**Solution:**
1. Check if redirect URI is registered
2. Verify Client ID is correct
3. Check browser console for errors

### Issue 3: "Failed to authenticate with Riot Games"

**Cause:** Invalid Client Secret or token exchange failed

**Solution:**
1. Verify `RIOT_CLIENT_SECRET` in `.env` matches the one in Riot Developer Portal
2. Make sure you're using the OAuth Client Secret (not API key)
3. Check API server logs for detailed error

### Issue 4: "Cannot retrieve access token"

**Cause:** User account not linked yet

**Solution:**
1. Complete the OAuth flow first
2. Make sure you're authenticated (have a token in localStorage)

### Issue 5: API Key Not Working

**Cause:** Invalid or expired API key

**Solution:**
1. Personal API keys expire after 24 hours
2. Get a new API key from Riot Developer Portal
3. Update `RIOT_API_KEY` in `.env`
4. Restart API server

## Testing the Connection

### Step 1: Test Configuration
```bash
curl http://192.168.0.159:4000/auth/riot/test/config
```

Expected response:
```json
{
  "hasClientId": true,
  "hasClientSecret": true,
  "redirectUri": "http://192.168.0.159:4000/auth/riot/callback",
  "hasApiKey": true,
  "apiKeyLength": 56,
  "clientIdPreview": "795..."
}
```

### Step 2: Test OAuth Flow

1. Go to Settings page
2. Click "Connect Riot Account"
3. You should be redirected to Riot login
4. After logging in, you should be redirected back
5. Check browser console and API server logs for errors

### Step 3: Verify Connection

After successful OAuth:
1. Go to Settings page
2. Should see "Connected" with your Riot ID
3. Check API server logs for successful token exchange

## Debugging Tips

### Enable Detailed Logging

The API now logs detailed information:
- When OAuth callback is received
- When tokens are exchanged
- When account info is retrieved
- When session is created

Check your API server console for these logs.

### Check Browser Console

Open browser DevTools (F12) and check:
- Network tab for failed requests
- Console tab for JavaScript errors
- Application tab → Local Storage for `auth_token`

### Check Network Requests

In browser DevTools → Network:
1. Look for `/auth/riot/start` - should redirect to Riot
2. Look for `/auth/riot/callback` - should have `code` parameter
3. Look for `/auth/callback` - should have `token` parameter

## Still Not Working?

1. **Double-check all credentials** in `.env` file
2. **Verify redirect URI** is registered in Riot Developer Portal
3. **Check API server is running** on port 4000
4. **Check frontend is running** on port 3000
5. **Review API server logs** for detailed error messages
6. **Try using `localhost`** instead of IP address if testing locally
7. **Wait a few minutes** after making changes in Riot Developer Portal

## Next Steps After Successful Connection

Once OAuth works:
1. Your Riot account will be linked
2. You can access Riot API endpoints
3. Live game detection will work
4. Match history will be available
