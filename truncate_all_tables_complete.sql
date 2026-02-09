-- Complete truncate script that handles foreign key constraints properly
-- This script truncates all tables in the correct order to avoid FK constraint errors

-- Step 1: Truncate aggregated tables (no dependencies)
TRUNCATE TABLE bucket_totals CASCADE;
TRUNCATE TABLE champion_stats CASCADE;
TRUNCATE TABLE champion_rune_pages CASCADE;
TRUNCATE TABLE champion_spell_sets CASCADE;
TRUNCATE TABLE champion_item_builds CASCADE;

-- Step 2: Truncate match-related tables together (they have FK relationships)
-- PostgreSQL requires truncating parent and child tables together, or using CASCADE
TRUNCATE TABLE 
  participant_perks,
  participant_spells,
  participant_final_items,
  match_bans,
  match_participants,
  matches
CASCADE;

-- Step 4: Truncate user-related child tables
TRUNCATE TABLE room_members CASCADE;
TRUNCATE TABLE user_settings CASCADE;
TRUNCATE TABLE sessions CASCADE;

-- Step 5: Truncate user-related parent tables
TRUNCATE TABLE voice_rooms CASCADE;
TRUNCATE TABLE riot_accounts CASCADE;
TRUNCATE TABLE users CASCADE;

-- Verify all tables are empty
SELECT 
  'matches' AS table_name, COUNT(*) AS count FROM matches
UNION ALL
SELECT 'match_participants', COUNT(*) FROM match_participants
UNION ALL
SELECT 'match_bans', COUNT(*) FROM match_bans
UNION ALL
SELECT 'participant_perks', COUNT(*) FROM participant_perks
UNION ALL
SELECT 'participant_spells', COUNT(*) FROM participant_spells
UNION ALL
SELECT 'participant_final_items', COUNT(*) FROM participant_final_items
UNION ALL
SELECT 'champion_rune_pages', COUNT(*) FROM champion_rune_pages
UNION ALL
SELECT 'champion_spell_sets', COUNT(*) FROM champion_spell_sets
UNION ALL
SELECT 'champion_item_builds', COUNT(*) FROM champion_item_builds
UNION ALL
SELECT 'champion_stats', COUNT(*) FROM champion_stats
UNION ALL
SELECT 'bucket_totals', COUNT(*) FROM bucket_totals;
