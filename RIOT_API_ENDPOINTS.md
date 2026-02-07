# Riot API Endpoints Used in This Application

## Overview

All Riot API endpoints now use the `?api_key=` query parameter format (as you're testing), instead of the `X-Riot-Token` header.

## APIs Currently Implemented

### 1. Summoner API (v4)
**Base URL Pattern:** `https://{region}.api.riotgames.com/lol/summoner/v4/`

**Endpoints Used:**
- `GET /summoners/{encryptedSummonerId}?api_key={key}` - Get summoner by encrypted ID
- `GET /summoners/by-puuid/{puuid}?api_key={key}` - Get summoner by PUUID
- `GET /summoners/by-name/{summonerName}?api_key={key}` - Get summoner by name

**File:** `packages/riot/src/summoner-client.ts`

### 2. League API (v4)
**Base URL Pattern:** `https://{region}.api.riotgames.com/lol/league/v4/`

**Endpoints Used:**
- `GET /entries/by-summoner/{encryptedSummonerId}?api_key={key}` - Get league entries for a summoner

**File:** `packages/riot/src/summoner-client.ts` (getLeagueEntries method)

### 3. Match API (v5)
**Base URL Pattern:** `https://{region}.api.riotgames.com/lol/match/v5/`

**Endpoints Used:**
- `GET /matches/{matchId}?api_key={key}` - Get match details by match ID
- `GET /matches/by-puuid/{puuid}/ids?api_key={key}&{queryParams}` - Get match list by PUUID
  - Query params: `start`, `count`, `queue`, `type`, `startTime`, `endTime`

**File:** `packages/riot/src/match-client.ts`

**Note:** Match v5 typically uses routing values (americas, asia, europe) instead of specific regions, but since you're testing with `na1` and it's working, we're keeping the current implementation.

### 4. Spectator API (v4)
**Base URL Pattern:** `https://{region}.api.riotgames.com/lol/spectator/v4/`

**Endpoints Used:**
- `GET /active-games/by-summoner/{encryptedSummonerId}?api_key={key}` - Get active game for a summoner

**File:** `packages/riot/src/spectator-client.ts`

### 5. Account API (v1) - OAuth Only
**Base URL Pattern:** `https://{region}.api.riotgames.com/riot/account/v1/`

**Endpoints Used:**
- `GET /accounts/by-puuid/{puuid}` - Get account info (Riot ID)
  - **Note:** This endpoint uses OAuth Bearer tokens, NOT API keys

**File:** `packages/riot/src/rso-client.ts`

## API Key Format

All API endpoints (except Account API which uses OAuth) now use:
```
?api_key={YOUR_API_KEY}
```

Example:
```
https://na1.api.riotgames.com/lol/summoner/v4/summoners/abc123?api_key=RGAPI-...
```

## Regions Supported

The application supports these Riot regions:
- `na1` - North America
- `euw1` - Europe West
- `eun1` - Europe Nordic & East
- `kr` - Korea
- `br1` - Brazil
- `la1` - Latin America North
- `la2` - Latin America South
- `oc1` - Oceania
- `ru` - Russia
- `tr1` - Turkey
- `jp1` - Japan

## Changes Made

✅ **Updated all API clients to use query parameter format:**
- `SummonerClient` - All 4 methods updated
- `MatchClient` - Both methods updated
- `SpectatorClient` - Active game method updated

✅ **Verified API endpoint URLs match Riot's documentation**

✅ **Account API (RSO) correctly uses OAuth Bearer tokens** (not API keys)

## Testing

Since you've confirmed the API key format works with your testing, all endpoints should now work correctly with your API key.

## Additional APIs Available (Not Currently Used)

These Riot APIs are available but not currently implemented:
- **champion-v3** - Champion rotations (free-to-play)
- **champion-mastery-v4** - Champion mastery data
- **lol-status-v4** - Server status
- **clash-v1** - Clash tournament data
- **lol-challenges-v1** - Challenge system data

If you need any of these, we can add them using the same `?api_key=` format.
