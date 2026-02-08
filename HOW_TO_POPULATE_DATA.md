# How to Populate Champion Data from Riot API

## The Problem
Your database is empty - no matches have been fetched from Riot API yet. The Champions page shows "No champion data available" because there's no data to display.

## Solution: Trigger Batch Seeding

You need to **manually trigger** the batch seeding process to fetch match data from Riot API.

### Step 1: Make Sure API Server is Running

```bash
cd ~/League_Comms
npm run dev
```

Or if running separately:
```bash
cd apps/api
npm run dev
```

Check that it's running by visiting: `http://localhost:4000/health`

### Step 2: Trigger Batch Seeding

**Option A: Using curl (Terminal)**
```bash
curl -X POST "http://localhost:4000/champions/seed/batch?region=na1&matchesPerPlayer=100&playersPerTierDivision=50"
```

**Option B: Using Browser**
Open this URL in your browser (it will make a POST request):
```
http://localhost:4000/champions/seed/batch?region=na1&matchesPerPlayer=100&playersPerTierDivision=50
```

**Option C: Using a REST Client (Postman, Insomnia, etc.)**
- Method: `POST`
- URL: `http://localhost:4000/champions/seed/batch`
- Query params:
  - `region=na1`
  - `matchesPerPlayer=100` (optional, default: 100)
  - `playersPerTierDivision=50` (optional, default: 50)

### Step 3: Monitor Progress

Check the seeding progress:

```bash
curl http://localhost:4000/champions/progress
```

Or in browser: `http://localhost:4000/champions/progress`

You should see:
```json
{
  "status": "running",
  "totalPlayers": 1400,
  "processedPlayers": 45,
  "totalMatchesIngested": 1234,
  "currentTier": "EMERALD",
  "currentDivision": "I"
}
```

### Step 4: Wait for Data Collection

The batch seeding process will:
1. Fetch players from all ranks (Iron → Challenger)
2. Get their match IDs from Riot API
3. Ingest matches into your database
4. This can take **30 minutes to several hours** depending on:
   - Number of players processed
   - Number of matches per player
   - Riot API rate limits

### Step 5: Run Aggregation

After matches are ingested, you need to aggregate them into champion statistics.

**Automatic (Recommended):**
Aggregation runs automatically every 10 minutes via cron job.

**Manual Trigger:**
You can also trigger it manually by calling the aggregation service (this requires adding an endpoint or using Prisma Studio to run the SQL).

### Step 6: Check Database

Once seeding and aggregation complete, check your database:

```bash
# Open Prisma Studio
cd apps/api
npm run prisma:studio
```

You should see:
- `Match` table with many rows (> 0)
- `MatchParticipant` table with many rows
- `ChampionStat` table with aggregated data
- `BucketTotal` table with denominators

### Step 7: View Champions

Once data is populated, the Champions page should display data:

```
http://192.168.0.159:3000/champions
```

## Troubleshooting

### "No champion data available" still showing

1. **Check if seeding is running:**
   ```bash
   curl http://localhost:4000/champions/progress
   ```

2. **Check API server logs** for errors:
   - Look for "Failed to ingest match" warnings
   - Check for API key errors
   - Verify Riot API is accessible

3. **Check database directly:**
   ```bash
   npm run prisma:studio
   ```
   - Check if `Match` table has data
   - Check if `ChampionStat` table has data (needs aggregation)

4. **Verify API key is set:**
   ```bash
   cat apps/api/.env | grep RIOT_API_KEY
   ```
   Should show your API key (not "your-riot-api-key-here")

### Seeding is slow

This is normal! The process:
- Respects Riot API rate limits (100 requests per 2 minutes for dev keys)
- Processes thousands of players
- Can take hours to complete

### Want faster results?

Start with a smaller seed:
```bash
curl -X POST "http://localhost:4000/champions/seed/batch?playersPerTierDivision=10&matchesPerPlayer=20"
```

This will process fewer players but complete faster.

## Quick Test

To quickly test if everything works, try the simple seed endpoint:

```bash
curl -X POST "http://localhost:4000/champions/seed?region=na1&sourcePlayers=5"
```

This fetches matches from just 5 high-elo players (faster, but less data).
