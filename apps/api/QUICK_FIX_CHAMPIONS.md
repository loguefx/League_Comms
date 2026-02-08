# Quick Fix: Get Champions to Show Up

## The Problem

You're getting `{"champions":[]}` because:
- ✅ Matches ARE in the database (raw match data)
- ❌ Champion stats haven't been aggregated yet (no `champion_stats` table entries)

## The Solution

### Step 1: Check What Data You Have

```cmd
curl "http://192.168.0.159:4000/champions/diagnostics"
```

This will show:
- How many matches exist
- How many champion stats exist (probably 0)
- What rank brackets are available

### Step 2: Run Aggregation

This converts your raw matches into champion statistics:

```cmd
curl -X POST "http://192.168.0.159:4000/champions/aggregate"
```

Wait for it to complete (check the API server logs). You should see:
```
[AggregationService] Starting champion stats aggregation
[AggregationService] Computing bucket totals...
[AggregationService] Computing champion stats...
[AggregationService] Champion stats aggregation complete
```

### Step 3: Query Again

After aggregation completes:

```cmd
curl "http://192.168.0.159:4000/champions?rank=iron&role=ALL&patch=latest"
```

You should now see champion data!

## Why This Happens

The system has two stages:
1. **Ingestion** - Fetches matches from Riot API → stores in `matches` table
2. **Aggregation** - Converts matches → calculates win rates → stores in `champion_stats` table

The frontend queries `champion_stats`, not raw matches. So you need to run aggregation after ingesting matches.

## Automatic Aggregation

Aggregation runs automatically every 10 minutes, but you can trigger it manually with the `/champions/aggregate` endpoint.

## Full Workflow

```cmd
REM 1. Check what you have
curl "http://192.168.0.159:4000/champions/diagnostics"

REM 2. If you have matches but no stats, aggregate:
curl -X POST "http://192.168.0.159:4000/champions/aggregate"

REM 3. Wait a few seconds, then query:
curl "http://192.168.0.159:4000/champions?rank=iron&role=ALL&patch=latest"

REM 4. Check frontend - it should now show champions!
```
