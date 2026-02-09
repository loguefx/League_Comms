-- Check if raw build data exists
SELECT 
  'participant_perks' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT champion_id) as unique_champions,
  COUNT(DISTINCT patch) as unique_patches
FROM participant_perks pp
JOIN matches m ON m.match_id = pp.match_id
WHERE m.patch IS NOT NULL;

SELECT 
  'participant_spells' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT champion_id) as unique_champions
FROM participant_spells ps
JOIN matches m ON m.match_id = ps.match_id
WHERE m.patch IS NOT NULL;

SELECT 
  'participant_final_items' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT champion_id) as unique_champions
FROM participant_final_items pfi
JOIN matches m ON m.match_id = pfi.match_id
WHERE m.patch IS NOT NULL;

-- Check if aggregated build data exists
SELECT 
  'champion_rune_pages' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT champion_id) as unique_champions,
  COUNT(DISTINCT patch) as unique_patches
FROM champion_rune_pages;

SELECT 
  'champion_spell_sets' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT champion_id) as unique_champions,
  COUNT(DISTINCT patch) as unique_patches
FROM champion_spell_sets;

SELECT 
  'champion_item_builds' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT champion_id) as unique_champions,
  COUNT(DISTINCT patch) as unique_patches
FROM champion_item_builds;

-- Check available patches
SELECT DISTINCT patch 
FROM matches 
WHERE patch IS NOT NULL 
ORDER BY patch DESC 
LIMIT 10;
