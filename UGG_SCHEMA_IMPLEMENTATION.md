# U.GG-Style Schema Implementation

## ✅ What Was Implemented

We've implemented a U.GG-style PostgreSQL schema for the Champions Tier List, following the design you provided.

### New Schema Structure

1. **Matches Table** (`matches`)
   - Stores raw match data
   - Key fields: `match_id`, `region`, `queue_id`, `patch`, `rank_bracket`, `game_start_ts`, `duration_s`
   - `rank_bracket` is stored on the match (not on participants)

2. **Match Participants Table** (`match_participants`)
   - Composite primary key: `(match_id, puuid)`
   - Stores: `champion_id`, `role` (TOP/JUNGLE/MIDDLE/BOTTOM/UTILITY), `win`, `team_id`

3. **Match Bans Table** (`match_bans`)
   - Stores ban data per match
   - Composite primary key: `(match_id, team_id, pick_turn)`

4. **Bucket Totals Table** (`bucket_totals`)
   - Pre-computed denominators for pick/ban rate calculations
   - Key: `(patch, region, queue_id, rank_bracket, role)`
   - Stores: `total_games`, `total_matches`

5. **Champion Stats Table** (`champion_stats`)
   - Pre-aggregated statistics (like U.GG)
   - Key: `(patch, region, queue_id, rank_bracket, role, champion_id)`
   - Stores: `games`, `wins`, `banned_matches`
   - Supports both role-specific and "ALL" roles

### Updated Services

1. **IngestionService**
   - Writes to new schema structure
   - Extracts bans into `match_bans` table
   - Uses `rank_bracket` on matches

2. **AggregationService**
   - Uses raw SQL queries (as per your design)
   - Computes bucket totals (role-specific + ALL roles)
   - Computes champion stats (role-specific + ALL roles)
   - Computes ban stats
   - Runs automatically every 10 minutes via cron

3. **AnalyticsService**
   - Queries from `champion_stats` + `bucket_totals`
   - Computes win rate, pick rate, ban rate
   - Returns data sorted by win rate

### Role Mapping

Roles are normalized to U.GG format:
- `TOP` → `TOP`
- `JUNGLE` → `JUNGLE`
- `MIDDLE` / `MID` → `MIDDLE`
- `BOTTOM` / `ADC` → `BOTTOM`
- `UTILITY` / `SUPPORT` → `UTILITY`
- `ALL` → `ALL` (for "All Roles" aggregation)

### Rank Bracket Mapping

Tiers are converted to rank brackets:
- `IRON`, `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`, `EMERALD`, `DIAMOND` → lowercase (e.g., `emerald`)
- `MASTER`, `GRANDMASTER`, `CHALLENGER` → `master_plus`
- `ALL_RANKS` → `all_ranks`

## 🔧 Next Steps

### 1. Run Database Migration

The Prisma schema has been updated. You need to:

```bash
cd apps/api
npm run prisma:generate
npm run prisma:migrate
```

This will:
- Create the new tables
- Create indexes
- Set up foreign keys

**Note:** If you have existing data in the old schema, you'll need to migrate it or start fresh.

### 2. Test the System

After migration:

1. **Start API server:**
   ```bash
   npm run dev
   ```

2. **Trigger batch seeding:**
   ```bash
   POST http://localhost:4000/champions/seed/batch
   ```

3. **Check progress:**
   ```bash
   GET http://localhost:4000/champions/progress
   ```

4. **Check diagnostics:**
   ```bash
   GET http://localhost:4000/champions/diagnostics
   ```

5. **View champion stats:**
   ```bash
   GET http://localhost:4000/champions?rank=emerald_plus&role=MIDDLE&patch=latest
   ```

### 3. Aggregation

Aggregation runs automatically every 10 minutes, or you can trigger it manually:

```typescript
// In your code or via endpoint
await aggregationService.triggerAggregation();
```

## 📊 Query Examples

### Get Mid Lane Champions for Emerald+ (Patch 16.3)

```sql
SELECT
  cs.champion_id,
  cs.games,
  cs.wins,
  (cs.wins::numeric / NULLIF(cs.games, 0)) AS win_rate,
  (cs.games::numeric / NULLIF(bt.total_games, 0)) AS pick_rate,
  (cs.banned_matches::numeric / NULLIF(bt.total_matches, 0)) AS ban_rate
FROM champion_stats cs
JOIN bucket_totals bt
  ON bt.patch = cs.patch
 AND bt.region = cs.region
 AND bt.queue_id = cs.queue_id
 AND bt.rank_bracket = cs.rank_bracket
 AND bt.role = cs.role
WHERE cs.patch = '16.3'
  AND cs.region = 'na1'
  AND cs.queue_id = 420
  AND cs.rank_bracket = 'emerald_plus'
  AND cs.role = 'MIDDLE'
ORDER BY win_rate DESC;
```

### Get All Roles Champions

Same query but with `cs.role = 'ALL'`

## 🎯 Key Differences from Old Schema

1. **Normalized structure**: Separate tables for matches, participants, bans
2. **Pre-aggregated stats**: `champion_stats` table for fast queries
3. **Bucket totals**: Separate table for denominators (pick/ban rates)
4. **Rank bracket on matches**: Not on participants
5. **SQL-based aggregation**: Uses raw SQL for performance
6. **Role enum format**: TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY, ALL

## ⚠️ Important Notes

- **Migration will drop old tables** if you run `prisma migrate dev` with a fresh database
- **Existing data** in old schema won't automatically migrate
- **Rank brackets** need to match between ingestion and query (e.g., `emerald_plus` not `EMERALD_PLUS`)
- **Aggregation must run** after ingesting matches to populate `champion_stats` and `bucket_totals`
