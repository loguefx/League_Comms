-- SELECT queries for all database tables
-- Use these queries to inspect data in your database

-- ============================================
-- USER AND AUTH TABLES
-- ============================================

-- Users table
SELECT * FROM users;

-- Riot accounts table
SELECT * FROM riot_accounts;

-- Sessions table
SELECT * FROM sessions;

-- Voice rooms table
SELECT * FROM voice_rooms;

-- Room members table
SELECT * FROM room_members;

-- User settings table
SELECT * FROM user_settings;

-- ============================================
-- MATCH DATA TABLES
-- ============================================

-- Matches table
SELECT * FROM matches;

-- Match participants table
SELECT * FROM match_participants;

-- Match bans table
SELECT * FROM match_bans;

-- Participant perks (runes) table
SELECT * FROM participant_perks;

-- Participant spells table
SELECT * FROM participant_spells;

-- Participant final items table
SELECT * FROM participant_final_items;

-- ============================================
-- AGGREGATED STATISTICS TABLES
-- ============================================

-- Bucket totals table
SELECT * FROM bucket_totals;

-- Champion stats table
SELECT * FROM champion_stats;

-- ============================================
-- AGGREGATED BUILD RECOMMENDATIONS TABLES
-- ============================================

-- Champion rune pages table
SELECT * FROM champion_rune_pages;

-- Champion spell sets table
SELECT * FROM champion_spell_sets;

-- Champion item builds table
SELECT * FROM champion_item_builds;

-- ============================================
-- USEFUL QUERIES WITH LIMITS AND FILTERS
-- ============================================

-- Count records in each table
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'riot_accounts', COUNT(*) FROM riot_accounts
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'voice_rooms', COUNT(*) FROM voice_rooms
UNION ALL
SELECT 'room_members', COUNT(*) FROM room_members
UNION ALL
SELECT 'user_settings', COUNT(*) FROM user_settings
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
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
SELECT 'bucket_totals', COUNT(*) FROM bucket_totals
UNION ALL
SELECT 'champion_stats', COUNT(*) FROM champion_stats
UNION ALL
SELECT 'champion_rune_pages', COUNT(*) FROM champion_rune_pages
UNION ALL
SELECT 'champion_spell_sets', COUNT(*) FROM champion_spell_sets
UNION ALL
SELECT 'champion_item_builds', COUNT(*) FROM champion_item_builds
ORDER BY table_name;

-- Recent matches (last 10)
SELECT * FROM matches ORDER BY game_start_ts DESC LIMIT 10;

-- Champion stats for patch 16.3
SELECT * FROM champion_stats WHERE patch = '16.3' ORDER BY games DESC LIMIT 20;

-- Item builds for a specific champion (champion ID 15 = Sivir)
SELECT * FROM champion_item_builds WHERE champion_id = 15 ORDER BY games DESC;

-- Rune pages for a specific champion
SELECT * FROM champion_rune_pages WHERE champion_id = 15 ORDER BY games DESC;

-- Spell sets for a specific champion
SELECT * FROM champion_spell_sets WHERE champion_id = 15 ORDER BY games DESC;

-- Item builds by build type
SELECT build_type, COUNT(*) AS count, SUM(games) AS total_games
FROM champion_item_builds
GROUP BY build_type
ORDER BY build_type;

-- Check if aggregation has run (should have data in aggregated tables)
SELECT 
  (SELECT COUNT(*) FROM champion_rune_pages) AS rune_pages,
  (SELECT COUNT(*) FROM champion_spell_sets) AS spell_sets,
  (SELECT COUNT(*) FROM champion_item_builds) AS item_builds,
  (SELECT COUNT(*) FROM champion_stats) AS champion_stats;
