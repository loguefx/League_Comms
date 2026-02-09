-- Fix for truncating matches table with foreign key constraints
-- This truncates all match-related tables together to avoid FK errors

-- Option 1: Truncate all match-related tables together (RECOMMENDED)
TRUNCATE TABLE 
  participant_perks,
  participant_spells,
  participant_final_items,
  match_bans,
  match_participants,
  matches
CASCADE;

-- Option 2: If you only want to truncate matches and its children, use CASCADE
-- TRUNCATE TABLE matches CASCADE;

-- Verify tables are empty
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
SELECT 'participant_final_items', COUNT(*) FROM participant_final_items;
