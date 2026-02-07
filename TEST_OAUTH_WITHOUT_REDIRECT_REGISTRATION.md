# Test OAuth Without Redirect URI Registration

## Your Observation

You noticed the Riot Developer Portal documentation focuses on **API Keys**, not OAuth Client ID/Secret. This is important!

## Two Different Systems

### 1. API Keys (What the Docs Show)
- Used for making API calls to Riot's data APIs
- Shown in the Developer Portal
- Used like: `?api_key=RGAPI-...` or `X-Riot-Token: ...`

### 2. OAuth/RSO (What We're Using)
- Used for user authentication (Riot Sign On)
- Client ID/Secret for OAuth flow
- **Might not require redirect URI registration for localhost/IP**

## Test: Try OAuth Flow Anyway

Since you have Client ID `795190`, let's test if the OAuth flow works **without** registering the redirect URI:

### Step 1: Make Sure Your `.env` is Set

Check `apps/api/.env` has:
```env
RIOT_CLIENT_ID=795190
RIOT_CLIENT_SECRET=your-client-secret-here
RIOT_REDIRECT_URI=http://192.168.0.159:4000/auth/riot/callback
RIOT_API_KEY=your-api-key-here
```

### Step 2: Start Your API Server

```bash
cd apps/api
npm run dev
```

### Step 3: Try the OAuth Flow

1. Go to: `http://192.168.0.159:3000` (or your frontend URL)
2. Click "Link Riot Account" or similar
3. See if it redirects to Riot's login page
4. After logging in, see if Riot redirects back successfully

### Step 4: Check the Results

**If it works:**
- ✅ Riot might allow localhost/IP redirect URIs without registration
- ✅ You don't need to register redirect URIs for development
- ✅ The OAuth flow will work as-is

**If you get "redirect_uri_mismatch" error:**
- ❌ Redirect URI registration is required
- ❌ You'll need to contact Riot Support to add it

## Why This Might Work

Many OAuth providers (including Riot) allow:
- `localhost` redirect URIs without registration
- `127.0.0.1` redirect URIs without registration
- Local IP addresses (like `192.168.x.x`) without registration

**For production**, you'd need to register the redirect URI, but for development, it might work automatically.

## What to Look For

When you try the OAuth flow:

1. **Does it redirect to Riot's login?** ✅ Good sign
2. **After login, does Riot redirect back?** ✅ It works!
3. **Do you get "redirect_uri_mismatch" error?** ❌ Need registration

## Next Steps

1. **Test the OAuth flow** with your current setup
2. **Check the API logs** for any errors
3. **If it works**: Great! No redirect URI registration needed for development
4. **If it fails**: Contact Riot Support to add the redirect URI

## Important Note

Even if OAuth works without redirect URI registration, you still need:
- ✅ **Client ID**: `795190` (you have this)
- ✅ **Client Secret**: (you need this - where did you get it?)
- ✅ **API Key**: (for making API calls)

The **API Key** is separate from OAuth - you use it to fetch match data, summoner info, etc.

## Summary

**Your observation is correct** - the docs focus on API keys. But we're using **OAuth (RSO)** for user authentication, which is a separate system.

**Test the OAuth flow** - it might work without redirect URI registration for localhost/IP addresses!
