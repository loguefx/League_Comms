-- Safe truncate script - Truncates all tables in correct order
-- This version truncates tables in dependency order without CASCADE
-- WARNING: This will delete ALL data from ALL tables!

-- Step 1: Truncate aggregated tables (no foreign key dependencies)
TRUNCATE TABLE bucket_totals;
TRUNCATE TABLE champion_stats;
TRUNCATE TABLE champion_rune_pages;
TRUNCATE TABLE champion_spell_sets;
TRUNCATE TABLE champion_item_builds;

-- Step 2: Truncate match-related child tables first
TRUNCATE TABLE participant_perks;
TRUNCATE TABLE participant_spells;
TRUNCATE TABLE participant_final_items;
TRUNCATE TABLE match_bans;
TRUNCATE TABLE match_participants;

-- Step 3: Truncate match parent table
TRUNCATE TABLE matches;

-- Step 4: Truncate user-related child tables
TRUNCATE TABLE room_members;
TRUNCATE TABLE user_settings;
TRUNCATE TABLE sessions;

-- Step 5: Truncate user-related parent tables
TRUNCATE TABLE voice_rooms;
TRUNCATE TABLE riot_accounts;
TRUNCATE TABLE users;
