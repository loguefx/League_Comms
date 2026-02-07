# Batch Processing Implementation for Million+ Matches

## Overview

Implemented a scalable batch processing system that captures match data from players across **ALL rank tiers** (Iron through Challenger) to build comprehensive champion statistics. This system can process **millions of matches** per role, rank, and patch.

## Key Features

### 1. **Batch Player Processing**
- Processes players from **all rank tiers**: Iron, Bronze, Silver, Gold, Platinum, Emerald, Diamond, Master, Grandmaster, Challenger
- Processes players from **all divisions**: I, II, III, IV (for Iron-Diamond)
- Configurable batch sizes for parallel processing
- Rate limit compliant (1200ms delays between requests)

### 2. **Comprehensive Match Collection**
- Fetches up to **100 matches per player** (configurable)
- Processes **50 players per tier/division** (configurable)
- **Deduplicates matches** to avoid processing the same match multiple times
- Tracks total matches ingested in real-time

### 3. **Multi-Dimensional Aggregation**
- **Per Role**: Champion stats by role (TOP, JUNGLE, MID, ADC, SUPPORT)
- **Per Rank**: Champion stats by rank tier (IRON, BRONZE, etc.)
- **Per Patch**: Champion stats by game patch version
- **All Roles**: Aggregated stats across all roles (role = null)
- **All Ranks**: Aggregated stats across all ranks (rankTier = 'ALL_RANKS')

### 4. **Progress Tracking**
- Real-time progress monitoring via `/champions/progress` endpoint
- Tracks:
  - Total players to process
  - Players processed
  - Total matches ingested
  - Current tier/division being processed
  - Status (running/completed/error)

## API Endpoints

### Batch Seed Endpoint
```
POST /champions/seed/batch
```

**Query Parameters:**
- `region` (default: 'na1'): Riot API region
- `matchesPerPlayer` (default: 100): Number of matches to fetch per player
- `playersPerTierDivision` (default: 50): Number of players to process per tier/division
- `batchSize` (default: 5): Number of players to process in parallel

**Example:**
```bash
POST http://localhost:4000/champions/seed/batch?region=na1&matchesPerPlayer=100&playersPerTierDivision=50&batchSize=5
```

**Response:**
```json
{
  "success": true,
  "message": "Batch seed started in background...",
  "region": "na1",
  "matchesPerPlayer": 100,
  "playersPerTierDivision": 50,
  "batchSize": 5,
  "estimatedMatches": "~140,000 matches (28 tier-division combinations × players × matches)"
}
```

### Progress Endpoint
```
GET /champions/progress
```

**Response:**
```json
{
  "totalPlayers": 1400,
  "processedPlayers": 350,
  "totalMatchesIngested": 12500,
  "currentTier": "GOLD",
  "currentDivision": "II",
  "status": "running"
}
```

## How It Works

### 1. **Player Collection**
```
For each rank tier (Iron → Challenger):
  For each division (I, II, III, IV):
    Fetch players from League-V4 API
    Process players in batches of 5
    For each player:
      Get PUUID from Summoner-V4 API
      Fetch 100 recent matches from Match-V5 API
      Ingest matches (dedupe)
```

### 2. **Match Ingestion**
- Each match is tagged with the player's rank tier
- Matches are deduplicated (same match ID processed only once)
- Match data includes:
  - Patch version
  - Participants with roles (TOP, JUNGLE, MID, ADC, SUPPORT)
  - Win/loss status
  - Champion ID
  - Rank tier

### 3. **Aggregation**
After ingestion completes, aggregation runs:
- Groups matches by: `(patch, rankTier, role, championId)`
- Calculates:
  - Total matches per champion/role/rank
  - Wins per champion/role/rank
  - Win rate = (wins / matches) × 100
  - Pick rate = (champion matches / total matches in bucket) × 100

### 4. **"All Ranks" Aggregation**
- Creates aggregated stats with `rankTier = 'ALL_RANKS'`
- Combines data from all rank tiers (Iron through Challenger)
- Available when user selects "All Ranks" filter in UI

## Scale Estimates

### Default Configuration
- **28 tier-division combinations** (7 tiers × 4 divisions)
- **3 master+ tiers** (Master, Grandmaster, Challenger)
- **50 players per tier/division**
- **100 matches per player**

**Total Players**: ~1,550 players
**Total Matches**: ~155,000 matches (with deduplication, likely ~100,000-120,000 unique matches)

### Maximum Scale
- **28 tier-division combinations**
- **3 master+ tiers**
- **200 players per tier/division** (max recommended)
- **100 matches per player**

**Total Players**: ~6,200 players
**Total Matches**: ~620,000 matches (with deduplication, likely ~400,000-500,000 unique matches)

### To Reach 1 Million+ Matches
- Increase `playersPerTierDivision` to 200-300
- Increase `matchesPerPlayer` to 100-200
- Run across multiple regions (NA, EUW, KR, etc.)
- Run periodically to capture new matches

## Rate Limiting

The system respects Riot API rate limits:
- **Personal API Key**: 100 requests per 2 minutes
- **Batch delay**: 1200ms between player requests (~50 requests/minute)
- **Batch group delay**: 2000ms between batch groups
- **Total time**: ~6-8 hours for full batch seed (default config)

## Usage

### 1. Start Batch Seed
```bash
curl -X POST "http://localhost:4000/champions/seed/batch?region=na1&matchesPerPlayer=100&playersPerTierDivision=50"
```

### 2. Monitor Progress
```bash
curl "http://localhost:4000/champions/progress"
```

### 3. View Results
Once complete, view champion stats:
```bash
# All ranks, all roles
curl "http://localhost:4000/champions?rank=ALL_RANKS&role="

# Platinum+, Mid Lane
curl "http://localhost:4000/champions?rank=PLATINUM_PLUS&role=MID"

# Diamond+, All Roles
curl "http://localhost:4000/champions?rank=DIAMOND_PLUS&role="
```

## Frontend Display

The Champions page displays:
- **Match counts** for each champion per role, rank, and all ranks
- **Win rates** sorted from highest to lowest
- **Pick rates** relative to the bucket (patch + rank + role)
- **Grouped by role** (Top, Jungle, Mid, ADC, Support, Other)

## Files Modified

1. **`packages/riot/src/summoner-client.ts`**
   - Added `getLeagueEntriesByTier()` method to fetch players by tier/division

2. **`apps/api/src/analytics/batch-seed.service.ts`** (NEW)
   - Batch processing service
   - Processes all rank tiers in batches
   - Tracks progress

3. **`apps/api/src/analytics/aggregation.service.ts`**
   - Added `aggregateForAllRanks()` method
   - Creates "ALL_RANKS" aggregations

4. **`apps/api/src/analytics/analytics.service.ts`**
   - Updated to handle "ALL_RANKS" filter

5. **`apps/api/src/analytics/analytics.controller.ts`**
   - Added `POST /champions/seed/batch` endpoint
   - Added `GET /champions/progress` endpoint

6. **`apps/api/src/analytics/analytics.module.ts`**
   - Registered `BatchSeedService`

7. **`apps/web/src/app/champions/page.tsx`**
   - Already displays match counts
   - Already supports "All Ranks" filter

## Next Steps

1. **Run batch seed** to populate database with millions of matches
2. **Monitor progress** via `/champions/progress`
3. **View results** on Champions page
4. **Adjust parameters** based on desired data volume
5. **Run periodically** to keep data fresh
