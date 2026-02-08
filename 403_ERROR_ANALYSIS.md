# 403 Error Analysis & Logic Verification

## The Problem

You're getting **403 Forbidden** errors with `Summoner ID: undefined`. This indicates:

1. **API calls are failing** (401/403) when fetching league entries
2. **Invalid data is being processed** - `player.summonerId` is `undefined`
3. **Error handling isn't catching failures properly**

## Root Cause

### Why `summonerId` is `undefined`

**Scenario 1: API Returns Empty/Malformed Array**
- When `getLeagueEntriesByTier` gets 401/403, it throws an error
- The error is caught, but the code might continue with an empty array
- Or the API returns a different structure (error object instead of array)

**Scenario 2: API Returns Error Object**
- Riot API might return `{ status: { message: "Forbidden", status_code: 403 } }` instead of an array
- Code tries to process this as if it's an array of players
- Result: `players[0]` is an error object, not a player, so `summonerId` is undefined

**Scenario 3: Error Handling Issue**
- The try-catch around API calls might not be working correctly
- Error is logged but code continues with invalid data

## API Calls Being Made

### 1. League-V4: Get League Entries by Tier
```
GET https://na1.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/{tier}/{division}?page=1&api_key={key}
```
**Expected:** Array of `LeagueEntry` objects  
**On 403:** Returns error object `{ status: { message: "Forbidden", status_code: 403 } }`

### 2. League-V4: Get Challenger/Grandmaster/Master League
```
GET https://na1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key={key}
```
**Expected:** `{ entries: LeagueEntry[] }`  
**On 403:** Returns error object

### 3. Summoner-V4: Get Summoner by ID
```
GET https://na1.api.riotgames.com/lol/summoner/v4/summoners/{summonerId}?api_key={key}
```
**Called with:** `undefined` (because `player.summonerId` is undefined)  
**Result:** 403 Forbidden

## What I Fixed

### 1. Added Validation
- Check if API response is actually an array
- Filter out players without `summonerId`
- Skip processing if no valid players found

### 2. Better Error Handling
- Validate `summonerId` before making API calls
- Log detailed error information
- Skip invalid tiers instead of crashing

### 3. Improved Logging
- Log how many players were found vs valid
- Log sample player structure when validation fails
- Better error messages

## Why 403 Errors Happen

### Common Causes:

1. **API Key Doesn't Have Permissions**
   - League-V4 API requires specific permissions
   - Check your Riot Developer Portal application settings

2. **API Key Expired**
   - Development keys expire after 24 hours
   - Your key expires: "Mon, Feb 9th, 2026 @ 12:54pm (PT) in 23 hours"

3. **API Key Blacklisted**
   - Too many rate limit violations
   - Suspicious activity detected

4. **Wrong API Key Type**
   - Using OAuth client credentials instead of API key
   - Using wrong application's key

## Verification Steps

### 1. Test Your API Key Directly

```bash
# Replace YOUR_API_KEY with your actual key
curl "https://na1.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/IRON/I?page=1&api_key=YOUR_API_KEY"
```

**Expected Response (200):**
```json
[
  {
    "leagueId": "...",
    "summonerId": "abc123...",
    "summonerName": "PlayerName",
    ...
  }
]
```

**If 403:**
```json
{
  "status": {
    "message": "Forbidden",
    "status_code": 403
  }
}
```

### 2. Check API Key Permissions

In Riot Developer Portal:
1. Go to your application
2. Check "API Access" or "Permissions"
3. Make sure **League-V4** and **Summoner-V4** are enabled

### 3. Verify API Key Format

Your API key should:
- Start with `RGAPI-`
- Be about 40-50 characters long
- Be from the "API Keys" section, not OAuth credentials

## After Fixing

Once you have a valid API key:

1. **Update .env file:**
   ```
   RIOT_API_KEY=RGAPI-your-new-key-here
   ```

2. **Restart API server** (important!)

3. **Re-run batch seeding:**
   ```bash
   curl -X POST "http://192.168.0.159:4000/champions/seed/batch?region=na1"
   ```

4. **Check logs** - you should see:
   - ✅ "Found X players in IRON I, Y valid, processing Z"
   - ✅ "Player PlayerName: Found N matches"
   - ✅ No more "Summoner ID: undefined" errors

## Summary

**The logic is correct** - the issue is:
1. **API key is invalid/expired** → Getting 403 errors
2. **Error handling wasn't robust** → Processing undefined data
3. **Now fixed** → Added validation to skip invalid data

Once you get a valid API key, the system should work correctly!
