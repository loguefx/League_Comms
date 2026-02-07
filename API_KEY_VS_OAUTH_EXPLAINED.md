# API Key vs OAuth - What's the Difference?

## Two Different Systems

### 1. API Key (✅ This Works!)

**What it's for:**
- Fetching match data
- Getting summoner information
- Checking live games
- Getting champion stats

**Your API Key:**
```
RIOT_API_KEY=RGAPI-cdb29c26-9ff2-404c-ab3a-8dbec3bdb046
```

**Status:** ✅ This is working! Your API key is valid and can fetch data from Riot's APIs.

**Where you got it:** From the Riot Developer Portal → Development API Key (or Production API Key)

### 2. OAuth Client ID/Secret (❌ This is Failing)

**What it's for:**
- User authentication (letting users log in with their Riot account)
- Getting user's Riot ID (gameName#tagLine)
- Linking user accounts to your app

**Your OAuth Credentials:**
```
RIOT_CLIENT_ID=795190
RIOT_CLIENT_SECRET=your-riot-client-secret-here  ← This is a placeholder!
```

**Status:** ❌ This is NOT working because:
1. Client Secret is still a placeholder (`your-riot-client-secret-here`)
2. Redirect URI may not be registered (though localhost might work)

**Where you need to get it:** From Riot Developer Portal → OAuth Application settings (which we couldn't find)

## Do You Need to Contact Riot Support?

### For API Key: ❌ NO
- Your API key is working fine
- You can fetch data, matches, summoner info, etc.
- No contact needed

### For OAuth: ✅ YES (if you don't have Client Secret)

**You need to contact Riot Support if:**
- You don't have your Client Secret (it's still a placeholder)
- You can't find where to register redirect URIs

**You DON'T need to contact if:**
- You have your actual Client Secret saved somewhere
- You just need to update the `.env` file with the real secret

## What You Can Do Right Now

### Option 1: Check if You Have Client Secret Saved

Look for:
- Notes/documentation when you created the OAuth app
- Email from Riot (if they sent one)
- Password manager or secure notes
- Any file where you saved credentials

### Option 2: Try localhost First (Even Without Real Secret)

Even with a placeholder secret, you can test if localhost redirect URI works:

1. Change `.env`:
   ```env
   RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback
   FRONTEND_URL=http://localhost:3000
   ```

2. Restart API

3. Try connecting from `http://localhost:3000`

**If you get a different error** (not "redirect_uri_mismatch"), then localhost works and you just need the real Client Secret.

### Option 3: Contact Riot Support

**Only if you don't have the Client Secret:**

1. Go to: `https://developer.riotgames.com/support`
2. Ask: "I have OAuth Client ID 795190. I need my Client Secret. I cannot find it in the Developer Portal."

## Summary

- ✅ **API Key**: Working fine, no contact needed
- ❌ **OAuth**: Needs real Client Secret (contact Riot if you don't have it)
- 🔄 **Redirect URI**: Try localhost first (might work without registration)

## Quick Test

To verify your API key is working:

```bash
# Test API key endpoint
curl http://localhost:4000/auth/riot/test/api-key
```

This should show your API key is configured and working.

The OAuth error is separate from the API key - they're two different systems!
