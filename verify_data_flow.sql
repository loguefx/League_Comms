-- Verification queries to check data flow at each step

-- ============================================
-- STEP 1: Check if matches are being ingested
-- ============================================
SELECT 
  'Matches ingested' AS step,
  COUNT(*) AS count,
  COUNT(DISTINCT patch) AS unique_patches,
  MIN(game_start_ts) AS earliest_match,
  MAX(game_start_ts) AS latest_match
FROM matches;

-- Check if build data is being stored
SELECT 
  'Participant Perks' AS table_name,
  COUNT(*) AS total_records,
  COUNT(DISTINCT match_id) AS matches_with_runes,
  COUNT(DISTINCT champion_id) AS champions_with_runes
FROM participant_perks
UNION ALL
SELECT 
  'Participant Spells',
  COUNT(*),
  COUNT(DISTINCT match_id),
  COUNT(DISTINCT champion_id)
FROM participant_spells
UNION ALL
SELECT 
  'Participant Final Items',
  COUNT(*),
  COUNT(DISTINCT match_id),
  COUNT(DISTINCT champion_id)
FROM participant_final_items;

-- Check item array structure (sample)
SELECT 
  match_id,
  champion_id,
  role,
  array_length(items, 1) AS items_array_length,
  items[1] AS item_at_position_1,
  items[2] AS item_at_position_2,
  items[3] AS item_at_position_3,
  items[4] AS item_at_position_4,
  items[5] AS item_at_position_5,
  items[6] AS item_at_position_6,
  items[7] AS item_at_position_7,
  items AS full_items_array
FROM participant_final_items
WHERE array_length(items, 1) > 0
LIMIT 10;

-- ============================================
-- STEP 2: Check if aggregation has run
-- ============================================
SELECT 
  'Champion Stats' AS table_name,
  COUNT(*) AS total_records,
  COUNT(DISTINCT patch) AS patches,
  COUNT(DISTINCT champion_id) AS champions
FROM champion_stats
UNION ALL
SELECT 
  'Champion Rune Pages',
  COUNT(*),
  COUNT(DISTINCT patch),
  COUNT(DISTINCT champion_id)
FROM champion_rune_pages
UNION ALL
SELECT 
  'Champion Spell Sets',
  COUNT(*),
  COUNT(DISTINCT patch),
  COUNT(DISTINCT champion_id)
FROM champion_spell_sets
UNION ALL
SELECT 
  'Champion Item Builds',
  COUNT(*),
  COUNT(DISTINCT patch),
  COUNT(DISTINCT champion_id)
FROM champion_item_builds;

-- Check item builds by type and patch
SELECT 
  patch,
  build_type,
  COUNT(*) AS build_count,
  SUM(games) AS total_games,
  COUNT(DISTINCT champion_id) AS champions_with_builds
FROM champion_item_builds
WHERE patch = '16.3'
GROUP BY patch, build_type
ORDER BY build_type;

-- Check specific champion (e.g., Sivir = 15)
SELECT 
  build_type,
  items,
  games,
  wins,
  ROUND((wins::numeric / NULLIF(games, 0)) * 100, 2) AS win_rate
FROM champion_item_builds
WHERE champion_id = 15 
  AND patch = '16.3'
  AND role = 'ALL'
ORDER BY build_type, games DESC
LIMIT 20;

-- ============================================
-- STEP 3: Verify data matches between raw and aggregated
-- ============================================
-- Check if raw item data exists for patch 16.3
SELECT 
  'Raw Items Data' AS data_type,
  COUNT(*) AS total_records,
  COUNT(DISTINCT champion_id) AS champions,
  COUNT(DISTINCT match_id) AS matches
FROM participant_final_items pfi
JOIN matches m ON m.match_id = pfi.match_id
WHERE m.patch = '16.3'
  AND m.queue_id = 420;

-- Check if aggregated item builds exist for same patch
SELECT 
  'Aggregated Item Builds' AS data_type,
  COUNT(*) AS total_records,
  COUNT(DISTINCT champion_id) AS champions,
  SUM(games) AS total_games
FROM champion_item_builds
WHERE patch = '16.3';

-- ============================================
-- STEP 4: Check rune data extraction
-- ============================================
-- Sample rune data
SELECT 
  match_id,
  champion_id,
  role,
  primary_style_id,
  sub_style_id,
  perk_ids,
  array_length(perk_ids, 1) AS perk_count
FROM participant_perks
WHERE primary_style_id > 0
LIMIT 10;

-- Check aggregated rune pages
SELECT 
  patch,
  champion_id,
  role,
  primary_style_id,
  sub_style_id,
  games,
  wins
FROM champion_rune_pages
WHERE patch = '16.3'
  AND champion_id = 15
ORDER BY games DESC
LIMIT 5;
