# Data Flow Verification Guide

This document traces the complete data flow from Riot API → Database → Aggregation → Frontend API → Frontend Display.

## Data Flow Overview

```
Riot API
  ↓
Match Pull Service (match-pull.service.ts)
  ↓
Ingestion Service (ingestion.service.ts)
  ↓
Database Tables:
  - matches
  - match_participants
  - participant_perks (runes)
  - participant_spells
  - participant_final_items
  ↓
Aggregation Service (aggregation.service.ts)
  ↓
Aggregated Tables:
  - champion_stats
  - champion_rune_pages
  - champion_spell_sets
  - champion_item_builds
  ↓
Analytics Controller (analytics.controller.ts)
  ↓
Frontend API Response
  ↓
Frontend Components (champions/page.tsx, champions/[championId]/page.tsx)
```

## Step-by-Step Verification

### Step 1: Riot API → Database (Ingestion)

**Files:**
- `apps/api/src/analytics/match-pull.service.ts` - Pulls matches from Riot API
- `apps/api/src/analytics/ingestion.service.ts` - Ingests match data into database

**Key Methods:**
- `match-pull.service.ts`: `pullMatchesFromRegion()` - Gets match IDs from Riot API
- `ingestion.service.ts`: `ingestMatch()` - Stores match data
- `ingestion.service.ts`: `extractPerks()` - Extracts rune data
- `ingestion.service.ts`: `extractSpells()` - Extracts spell data
- `ingestion.service.ts`: `extractFinalItems()` - Extracts item data

**Verification Queries:**
```sql
-- Check if matches are being ingested
SELECT COUNT(*) FROM matches;
SELECT COUNT(*) FROM participant_perks;
SELECT COUNT(*) FROM participant_spells;
SELECT COUNT(*) FROM participant_final_items;

-- Check a sample match with all data
SELECT 
  m.match_id,
  m.patch,
  COUNT(DISTINCT mp.puuid) as participants,
  COUNT(DISTINCT pp.puuid) as participants_with_runes,
  COUNT(DISTINCT ps.puuid) as participants_with_spells,
  COUNT(DISTINCT pfi.puuid) as participants_with_items
FROM matches m
LEFT JOIN match_participants mp ON mp.match_id = m.match_id
LEFT JOIN participant_perks pp ON pp.match_id = m.match_id
LEFT JOIN participant_spells ps ON ps.match_id = m.match_id
LEFT JOIN participant_final_items pfi ON pfi.match_id = m.match_id
GROUP BY m.match_id
LIMIT 10;
```

**Potential Issues:**
- ✅ Items extracted from `item0-item6` (correct)
- ✅ Runes extracted from `perks.styles[].selections[].perk` (correct)
- ✅ Spells extracted from `summoner1Id` and `summoner2Id` (correct)
- ⚠️ Check if `perks.styles` structure matches Riot API response format

### Step 2: Database → Aggregation

**Files:**
- `apps/api/src/analytics/aggregation.service.ts` - Orchestrates aggregation
- `apps/api/src/analytics/build-aggregation.service.ts` - Aggregates build data

**Key Methods:**
- `aggregation.service.ts`: `aggregateChampionStats()` - Runs all aggregation steps
- `build-aggregation.service.ts`: `aggregateRunePages()` - Aggregates runes
- `build-aggregation.service.ts`: `aggregateSpellSets()` - Aggregates spells
- `build-aggregation.service.ts`: `aggregateItemBuilds()` - Aggregates items

**Verification Queries:**
```sql
-- Check if aggregation has run
SELECT COUNT(*) FROM champion_stats;
SELECT COUNT(*) FROM champion_rune_pages;
SELECT COUNT(*) FROM champion_spell_sets;
SELECT COUNT(*) FROM champion_item_builds;

-- Check item builds by type
SELECT build_type, COUNT(*) as count, SUM(games) as total_games
FROM champion_item_builds
GROUP BY build_type
ORDER BY build_type;

-- Check if data exists for patch 16.3
SELECT 
  'champion_stats' as table_name,
  COUNT(*) as count
FROM champion_stats WHERE patch = '16.3'
UNION ALL
SELECT 'champion_rune_pages', COUNT(*) FROM champion_rune_pages WHERE patch = '16.3'
UNION ALL
SELECT 'champion_spell_sets', COUNT(*) FROM champion_spell_sets WHERE patch = '16.3'
UNION ALL
SELECT 'champion_item_builds', COUNT(*) FROM champion_item_builds WHERE patch = '16.3';
```

**Potential Issues:**
- ✅ Aggregation runs automatically every 2 minutes
- ✅ Item builds aggregated by position (starting, core, fourth, fifth, sixth)
- ⚠️ SQL GROUP BY errors fixed (should work now)
- ⚠️ Check if aggregation is actually running (check server logs)

### Step 3: Aggregated Tables → Frontend API

**Files:**
- `apps/api/src/analytics/analytics.controller.ts` - API endpoints
- `apps/api/src/analytics/analytics.service.ts` - Service layer

**Key Endpoints:**
- `GET /champions` - Champion tier list
- `GET /champions/:championId/build` - Champion build data

**Verification:**
```bash
# Test champion stats endpoint
curl "http://localhost:4000/champions?rank=ALL_RANKS&role=ALL&patch=16.3&region=world"

# Test champion build endpoint
curl "http://localhost:4000/champions/15/build?rank=ALL_RANKS&role=ALL&patch=16.3&region=world"
```

**Potential Issues:**
- ✅ Filters passed correctly from frontend
- ✅ BigInt values converted to numbers
- ⚠️ Check if `getAllItemBuilds` returns data for all build types
- ⚠️ Check if `getBuildArchetypes` returns rune/spell/item data

### Step 4: Frontend API → Frontend Display

**Files:**
- `apps/web/src/app/champions/page.tsx` - Champion tier list page
- `apps/web/src/app/champions/[championId]/page.tsx` - Champion build page

**Key Methods:**
- `champions/page.tsx`: `loadChampions()` - Fetches champion stats
- `champions/[championId]/page.tsx`: `loadBuild()` - Fetches build data
- `champions/[championId]/page.tsx`: `loadRuneImages()` - Loads rune images

**Verification:**
- Check browser console for fetch errors
- Check if data is received correctly
- Check if images are loading

**Potential Issues:**
- ✅ Rune style images paths fixed
- ✅ Item builds display logic correct
- ⚠️ Check if rune images are loading from Data Dragon
- ⚠️ Check if item images are loading from Data Dragon

## Common Issues and Fixes

### Issue 1: No Data in Database
**Symptoms:** All tables empty
**Fix:** Ensure match pulling is running and Riot API key is configured

### Issue 2: Aggregation Returns Empty Results
**Symptoms:** Aggregation runs but returns 0 items
**Fix:** Check if matches exist in database, check SQL queries for errors

### Issue 3: Frontend Shows Empty Data
**Symptoms:** API returns data but frontend shows empty
**Fix:** Check browser console for errors, verify API response format matches frontend expectations

### Issue 4: Images Not Loading
**Symptoms:** Rune/item images show as IDs or broken
**Fix:** Check Data Dragon version, verify image URLs are correct

## Verification Checklist

- [ ] Matches are being pulled from Riot API
- [ ] Match data is stored in database (matches, match_participants, etc.)
- [ ] Aggregation is running successfully
- [ ] Aggregated tables have data (champion_stats, champion_rune_pages, etc.)
- [ ] Frontend API endpoints return data
- [ ] Frontend displays data correctly
- [ ] Images load correctly (runes, spells, items)
- [ ] Filters work correctly (patch, rank, role, region)
