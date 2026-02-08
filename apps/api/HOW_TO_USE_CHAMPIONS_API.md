# How to Use the Champions API

## Overview

The Champions API has two main stages:
1. **Ingestion** - Fetch matches from Riot API and store raw data
2. **Aggregation** - Convert raw matches into champion statistics

## Step-by-Step Process

### 1. Ingest Matches (Seed Data)

You need to fetch matches from the Riot API first. There are two ways:

#### Option A: Quick Seed (High-elo only)
```bash
curl -X POST "http://192.168.0.159:4000/champions/seed?region=na1&sourcePlayers=20"
```
This fetches matches from Challenger/Grandmaster players only.

#### Option B: Full Batch Seed (All ranks)
```bash
curl -X POST "http://192.168.0.159:4000/champions/seed/batch?region=na1&matchesPerPlayer=100&playersPerTierDivision=50"
```
This processes players from ALL rank tiers (Iron through Challenger).

**Note:** Batch seeding respects rate limits and can take a long time. Check progress:
```bash
curl "http://192.168.0.159:4000/champions/progress"
```

### 2. Aggregate Data (Convert to Stats)

After matches are ingested, you need to aggregate them into champion statistics:

```bash
curl -X POST "http://192.168.0.159:4000/champions/aggregate"
```

This converts raw match data into:
- `champion_stats` table (win rates, pick rates per champion)
- `bucket_totals` table (denominators for pick/ban rates)

**Note:** Aggregation also runs automatically every 10 minutes, but you can trigger it manually.

### 3. Query Champion Stats

Once aggregated, you can query champion statistics:

```bash
# Get all champions for a specific rank
curl "http://192.168.0.159:4000/champions?rank=iron&role=ALL&patch=latest"

# Get champions for a specific role
curl "http://192.168.0.159:4000/champions?rank=iron&role=MIDDLE&patch=latest"

# Get champions for all ranks
curl "http://192.168.0.159:4000/champions?rank=ALL_RANKS&role=ALL&patch=latest"
```

## Important Notes

### Rank Brackets

The rank bracket must match what's in your database. If you seeded from "IRON" tier, you'll have `rank_bracket="iron"` in the database.

Available rank brackets:
- `iron`, `bronze`, `silver`, `gold`, `platinum`, `emerald`, `diamond`
- `master_plus` (for Master, Grandmaster, Challenger)
- `all_ranks` (aggregates across all ranks)

The frontend sends `PLATINUM_PLUS` but if you only have `iron` data, you need to either:
1. Query for `iron` instead
2. Seed higher rank tiers
3. Use `all_ranks` to see all data

### Roles

Available roles:
- `TOP`, `JUNGLE`, `MIDDLE`, `BOTTOM`, `UTILITY`
- `ALL` (aggregates across all roles)

### Patches

- `latest` - Uses the most recent patch in your database
- `16.3`, `16.2`, etc. - Specific patch version

## Check Database Status

```bash
curl "http://192.168.0.159:4000/champions/diagnostics"
```

This shows:
- How many matches are in the database
- How many champion stats exist
- What rank brackets and patches are available

## Complete Workflow Example

```bash
# 1. Seed matches (this takes time with rate limiting)
curl -X POST "http://192.168.0.159:4000/champions/seed/batch?region=na1&matchesPerPlayer=50&playersPerTierDivision=10"

# 2. Wait for seeding to complete (check progress)
curl "http://192.168.0.159:4000/champions/progress"

# 3. Aggregate the data
curl -X POST "http://192.168.0.159:4000/champions/aggregate"

# 4. Check what data you have
curl "http://192.168.0.159:4000/champions/diagnostics"

# 5. Query champions (use the rank bracket that exists in your DB)
curl "http://192.168.0.159:4000/champions?rank=iron&role=ALL&patch=latest"
```

## Troubleshooting

### "No champion data available"

1. **Check if matches exist:**
   ```bash
   curl "http://192.168.0.159:4000/champions/diagnostics"
   ```

2. **If matches exist but no stats:**
   - Run aggregation: `curl -X POST "http://192.168.0.159:4000/champions/aggregate"`

3. **If no matches:**
   - Run seeding: `curl -X POST "http://192.168.0.159:4000/champions/seed/batch?region=na1"`

4. **Check rank bracket:**
   - If you seeded from IRON tier, query with `rank=iron`
   - Don't query for `PLATINUM_PLUS` if you only have `iron` data

### Matches are being captured but champions don't show

- **Matches ARE capturing champions** - each match has 10 participants with `champion_id`
- The issue is likely that **aggregation hasn't run yet**
- Run: `curl -X POST "http://192.168.0.159:4000/champions/aggregate"`
