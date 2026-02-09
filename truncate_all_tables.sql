-- Truncate all tables in the database (CASCADE handles foreign key dependencies)
-- WARNING: This will delete ALL data from ALL tables!

-- Disable foreign key checks temporarily (PostgreSQL doesn't support this, so we use CASCADE instead)
-- Truncate aggregated tables first (no dependencies)
TRUNCATE TABLE bucket_totals CASCADE;
TRUNCATE TABLE champion_stats CASCADE;
TRUNCATE TABLE champion_rune_pages CASCADE;
TRUNCATE TABLE champion_spell_sets CASCADE;
TRUNCATE TABLE champion_item_builds CASCADE;

-- Truncate match-related tables (CASCADE will handle dependencies)
TRUNCATE TABLE participant_perks CASCADE;
TRUNCATE TABLE participant_spells CASCADE;
TRUNCATE TABLE participant_final_items CASCADE;
TRUNCATE TABLE match_bans CASCADE;
TRUNCATE TABLE match_participants CASCADE;
TRUNCATE TABLE matches CASCADE;

-- Truncate user-related tables (CASCADE will handle dependencies)
TRUNCATE TABLE room_members CASCADE;
TRUNCATE TABLE voice_rooms CASCADE;
TRUNCATE TABLE user_settings CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE riot_accounts CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequences (if any exist)
-- Note: Prisma uses cuid() for IDs, so no sequences to reset
