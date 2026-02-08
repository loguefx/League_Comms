-- SQL Commands for pgAdmin
-- Copy and paste these into pgAdmin's Query Tool
-- Make sure you're connected to the correct database (LVC)

-- First, check what columns exist (optional - just to see current state)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;

-- Fix column names: Rename from camelCase to snake_case
-- Only run the commands for columns that actually exist in your database

-- Rename matchId to match_id
ALTER TABLE matches RENAME COLUMN "matchId" TO match_id;

-- Rename queueId to queue_id
ALTER TABLE matches RENAME COLUMN "queueId" TO queue_id;

-- Rename gameStartTs to game_start_ts
ALTER TABLE matches RENAME COLUMN "gameStartTs" TO game_start_ts;

-- Rename durationS to duration_s
ALTER TABLE matches RENAME COLUMN "durationS" TO duration_s;

-- Rename gameVersion to game_version
ALTER TABLE matches RENAME COLUMN "gameVersion" TO game_version;

-- Rename rankBracket to rank_bracket
ALTER TABLE matches RENAME COLUMN "rankBracket" TO rank_bracket;

-- Rename processedAt to processed_at
ALTER TABLE matches RENAME COLUMN "processedAt" TO processed_at;

-- Verify the changes (optional - to confirm columns are renamed)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;
