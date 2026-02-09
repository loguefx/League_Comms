-- Working solution to truncate matches table with foreign key constraints
-- PostgreSQL requires CASCADE or truncating all related tables together

-- Option 1: Use CASCADE (simplest - recommended)
TRUNCATE TABLE matches CASCADE;

-- Option 2: Truncate all related tables in one statement
TRUNCATE TABLE 
  participant_perks,
  participant_spells,
  participant_final_items,
  match_bans,
  match_participants,
  matches;

-- Option 3: If you've already truncated the child tables, use CASCADE on matches
-- (This will work even if child tables are already empty)
TRUNCATE TABLE matches CASCADE;
