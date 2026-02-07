# U.GG-Style Champion Tier List Implementation

## Overview

This document explains how we've implemented the U.GG-style champion tier list pipeline based on Riot API data.

## Pipeline Architecture

### 1. Data Collection (Ingestion)

**Riot APIs Used:**
- **League-V4**: Get high-elo players (Challenger/Grandmaster/Master)
- **Summoner-V4**: Convert summoner IDs to PUUIDs
- **Match-V5**: Get match lists and match details

**Process:**
1. Fetch challenger league entries → Get PUUIDs
2. For each PUUID, fetch recent match IDs (Ranked Solo, queue 420)
3. For each match ID, fetch full match details
4. Extract and store:
   - Patch version (from `gameVersion`: "16.3.123.4567" → "16.3")
   - Participants with `teamPosition` (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)
   - Win/loss status
   - Champion ID
   - Rank tier (from seed source or match data)

**Match Filtering:**
- Skip remakes (`gameEndedInEarlySurrender`)
- Skip very short games (< 5 minutes)
- Only process Ranked Solo (420) and Ranked Flex (440)

### 2. Role Detection

**Primary Method:** Use `teamPosition` (most reliable)
- `TOP` → Top Lane
- `JUNGLE` → Jungle
- `MIDDLE` → Mid Lane
- `BOTTOM` → ADC
- `UTILITY` → Support

**Fallback:** `individualPosition` or `role` if `teamPosition` is missing

### 3. Aggregation (U.GG-Style)

**Two-Level Aggregation:**

**A) By Role:**
- Groups: `(patch, rankTier, role, championId)`
- Example: "16.3, PLATINUM_PLUS, MID, Ahri"
- Tracks: games played, wins

**B) All Roles:**
- Groups: `(patch, rankTier, null, championId)`
- Example: "16.3, PLATINUM_PLUS, null, Ahri"
- Aggregates champion across ALL roles
- Used when user selects "All Roles" filter

**Rank Brackets:**
- Individual: IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER
- Grouped: EMERALD_PLUS, PLATINUM_PLUS, DIAMOND_PLUS, etc.

### 4. Win Rate Calculation

**Formula:**
```
winRate = (wins / matches) * 100
```

**Example:**
- Ahri Mid: 3421 wins / 6612 games = 51.71% win rate

### 5. Pick Rate Calculation (U.GG-Style)

**Formula:**
```
pickRate = (championGames / totalGamesInBucket) * 100
```

**Bucket = (patch, rankTier, role)**

**Example:**
- Mid lane bucket has 100,000 total games
- Ahri Mid has 6,612 games
- Pick rate = (6,612 / 100,000) * 100 = 6.61%

**Important:** Pick rate is relative to the SAME bucket (same patch, rank, and role). This ensures:
- Mid lane pick rates don't mix with Top lane
- Patch 16.3 doesn't mix with 16.2
- Emerald+ doesn't mix with Diamond+

### 6. Display Logic

**Frontend Organization:**
1. Group champions by role (TOP, JUNGLE, MID, ADC, SUPPORT)
2. Within each role, sort by win rate (highest to lowest)
3. Display rank (#1, #2, etc.) within each role
4. Show all champions (no limit)

**"All Roles" Filter:**
- When selected, shows champions aggregated across all roles
- Still sorted by win rate
- Still organized by role sections, but data is from "ALL" aggregation

### 7. Patch Version Handling

**Extraction:**
```typescript
patch = gameVersion.split('.').slice(0, 2).join('.')
// "16.3.123.4567" → "16.3"
```

**Storage:**
- Stored at match ingestion time
- Part of every aggregation key
- Never mixed between patches

**Filtering:**
- "Latest" = most recent patch in database
- Specific patch = exact match (e.g., "16.3")

### 8. Data Model

**Match Table:**
- `matchId` (unique)
- `region`
- `patch` (e.g., "16.3")
- `gameMode`
- `participants[]`

**MatchParticipant Table:**
- `championId`
- `role` (TOP, JUNGLE, MID, ADC, SUPPORT, or null)
- `rankTier` (IRON, BRONZE, ..., CHALLENGER)
- `won` (boolean)
- `match` (relation)

**ChampionRankAgg Table:**
- `rankTier` (e.g., "PLATINUM_PLUS")
- `championId`
- `role` (TOP, JUNGLE, MID, ADC, SUPPORT, or null for "ALL")
- `patch` (e.g., "16.3")
- `matches` (games played)
- `wins`
- Unique key: `(rankTier, championId, role, patch)`

## API Endpoints

### GET /champions
**Query Parameters:**
- `rank`: Rank tier (e.g., "PLATINUM_PLUS", "EMERALD_PLUS")
- `role`: Role filter (e.g., "MID", "TOP", or empty/"ALL" for all roles)
- `patch`: Patch version (e.g., "16.3" or "latest")

**Response:**
```json
{
  "champions": [
    {
      "championId": 103,
      "rankTier": "PLATINUM_PLUS",
      "role": "MID",
      "patch": "16.3",
      "matches": 6612,
      "wins": 3421,
      "winRate": 51.71,
      "pickRate": 6.61
    }
  ],
  "totalMatchesPerRank": [...]
}
```

### POST /champions/seed
**Query Parameters:**
- `region`: Riot region (e.g., "na1")
- `sourcePlayers`: Number of high-elo players to fetch matches from (default: 20)

**Process:**
1. Fetches challenger league players
2. Gets their recent matches
3. Ingests matches
4. Runs aggregation
5. Populates `championRankAgg` table

## Key Differences from Simple Implementation

1. **Role Detection**: Uses `teamPosition` (most reliable) instead of `individualPosition`
2. **Match Filtering**: Skips remakes and invalid matches
3. **Dual Aggregation**: Both role-specific AND "ALL roles" aggregations
4. **Pick Rate**: Relative to bucket total, not global total
5. **Patch Isolation**: Every aggregation is patch-scoped
6. **No Limits**: Returns all champions, not just top 100

## Next Steps

1. Add ban rate tracking (extract from match teams)
2. Add tier scoring (S, A, B, C, D based on win rate + pick rate + sample size)
3. Add matchup statistics
4. Add region aggregation ("World" = all regions combined)
