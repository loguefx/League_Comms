-- Fix for truncating matches table with foreign key constraints
-- The matches table has foreign key relationships that prevent direct truncation

-- Option 1: Use CASCADE (recommended - truncates all dependent tables)
TRUNCATE TABLE matches CASCADE;

-- Option 2: If CASCADE doesn't work, truncate in dependency order
-- First truncate all child tables that reference matches
TRUNCATE TABLE participant_perks;
TRUNCATE TABLE participant_spells;
TRUNCATE TABLE participant_final_items;
TRUNCATE TABLE match_bans;
TRUNCATE TABLE match_participants;
-- Then truncate matches
TRUNCATE TABLE matches;

-- Option 3: Disable triggers temporarily (if above doesn't work)
-- WARNING: Use with caution - this disables all triggers temporarily
SET session_replication_role = 'replica';
TRUNCATE TABLE matches;
SET session_replication_role = 'origin';

-- Option 4: Delete instead of truncate (slower but works)
-- DELETE FROM participant_perks;
-- DELETE FROM participant_spells;
-- DELETE FROM participant_final_items;
-- DELETE FROM match_bans;
-- DELETE FROM match_participants;
-- DELETE FROM matches;
