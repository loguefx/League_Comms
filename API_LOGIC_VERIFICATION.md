# API Logic Verification & 403 Error Analysis

## Current Logic Flow

### Step 1: Get League Entries
```typescript
const players = await this.summonerClient.getLeagueEntriesByTier(
  region, 'RANKED_SOLO_5x5', tier, division, 1
);
```

**API Endpoint:**
```
GET https://{region}.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/{tier}/{division}?page=1&api_key={key}
```

**Expected Response:** Array of `LeagueEntry` objects with:
- `summonerId` (string) - **REQUIRED**
- `summonerName` (string)
- `tier` (string)
- `rank` (string)
- `leaguePoints` (number)
- etc.

### Step 2: Process Each Player
```typescript
const summoner = await this.summonerClient.getSummonerById(region, player.summonerId);
```

**API Endpoint:**
```
GET https://{region}.api.riotgames.com/lol/summoner/v4/summoners/{encryptedSummonerId}?api_key={key}
```

**Expected Response:** `Summoner` object with:
- `puuid` (string) - **REQUIRED**
- `id` (string)
- `name` (string)
- etc.

### Step 3: Get Match List
```typescript
const matchIds = await this.matchClient.getMatchList(region, summoner.puuid, {
  count: matchesPerPlayer,
  queue: 420,
  type: 'ranked',
});
```

**API Endpoint:**
```
GET https://{routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?queue=420&type=ranked&count=100&api_key={key}
```

**Expected Response:** Array of match ID strings

### Step 4: Ingest Each Match
```typescript
await this.ingestionService.ingestMatch(region, matchId, rankBracket);
```

**API Endpoint:**
```
GET https://{routingRegion}.api.riotgames.com/lol/match/v5/matches/{matchId}?api_key={key}
```

## The 403 Error Issue

### Problem Identified

The error shows:
```
Summoner ID: undefined
Error: Forbidden (403): API key doesn't have access to this endpoint or is blacklisted
```

**Root Cause:** `player.summonerId` is `undefined`, which means:
1. Either `getLeagueEntriesByTier` returned players without `summonerId` property
2. Or the API call failed but returned an empty/malformed array
3. Or the error handling isn't catching the failure properly

### Why This Happens

**Scenario 1: API Returns Empty Array on 401/403**
- If `getLeagueEntriesByTier` gets 401/403, it throws an error
- The error is caught, but the code might continue with an empty `players` array
- Then `playersToProcess` is empty, so nothing should process
- **BUT** if the error handling is wrong, it might try to process undefined players

**Scenario 2: API Returns Different Structure**
- Riot API might return a different structure on error
- Or the response parsing might be wrong
- Result: `players` array exists but objects don't have `summonerId`

**Scenario 3: Error Handling Issue**
- The try-catch around `getLeagueEntriesByTier` might not be working correctly
- Error is logged but code continues with undefined data

## Verification Steps

### 1. Check What `getLeagueEntriesByTier` Actually Returns

Add logging to see what the API actually returns:

```typescript
const players = await this.summonerClient.getLeagueEntriesByTier(...);
this.logger.log(`API returned ${players.length} players`);
if (players.length > 0) {
  this.logger.log(`First player structure: ${JSON.stringify(players[0])}`);
  this.logger.log(`First player has summonerId: ${!!players[0].summonerId}`);
}
```

### 2. Add Validation Before Processing

```typescript
const playersToProcess = players
  .filter(p => p && p.summonerId) // Filter out invalid players
  .slice(0, playersPerTierDivision);

if (playersToProcess.length === 0) {
  this.logger.warn(`No valid players found in ${tier} ${division}, skipping`);
  continue;
}
```

### 3. Test API Key Directly

Test if your API key works with a simple curl:

```bash
# Test League-V4 endpoint
curl "https://na1.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/IRON/I?page=1&api_key=YOUR_API_KEY"

# Test Summoner-V4 endpoint (need a real summoner ID first)
curl "https://na1.api.riotgames.com/lol/summoner/v4/summoners/SUMMONER_ID?api_key=YOUR_API_KEY"
```

## Likely Issues

### Issue 1: API Key Permissions
- **403 Forbidden** usually means:
  - API key doesn't have access to League-V4 or Summoner-V4 APIs
  - API key is blacklisted
  - API key is for a different application type

### Issue 2: API Key Expired
- Development keys expire after 24 hours
- Check expiration in Riot Developer Portal

### Issue 3: Error Handling
- When `getLeagueEntriesByTier` fails, the code should skip that tier
- But if error handling is wrong, it might try to process undefined data

## Recommended Fixes

1. **Add validation** to filter out invalid players
2. **Improve error handling** to skip tiers that fail
3. **Add logging** to see what the API actually returns
4. **Test API key** directly with curl to verify it works
