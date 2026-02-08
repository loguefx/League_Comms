-- Fix column names in matches table to match Prisma schema
-- Run this if your database has camelCase columns instead of snake_case

-- Connect to your database first:
-- psql -U postgres -d LVC

-- Check current column names (optional - just to see what you have)
-- \d matches

-- Rename columns from camelCase to snake_case (if needed)
-- Only run the ALTER TABLE commands for columns that actually exist

-- If matchId exists, rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'matchId'
    ) THEN
        ALTER TABLE matches RENAME COLUMN "matchId" TO match_id;
    END IF;
END $$;

-- If queueId exists, rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'queueId'
    ) THEN
        ALTER TABLE matches RENAME COLUMN "queueId" TO queue_id;
    END IF;
END $$;

-- If gameStartTs exists, rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'gameStartTs'
    ) THEN
        ALTER TABLE matches RENAME COLUMN "gameStartTs" TO game_start_ts;
    END IF;
END $$;

-- If durationS exists, rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'durationS'
    ) THEN
        ALTER TABLE matches RENAME COLUMN "durationS" TO duration_s;
    END IF;
END $$;

-- If gameVersion exists, rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'gameVersion'
    ) THEN
        ALTER TABLE matches RENAME COLUMN "gameVersion" TO game_version;
    END IF;
END $$;

-- If rankBracket exists, rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'rankBracket'
    ) THEN
        ALTER TABLE matches RENAME COLUMN "rankBracket" TO rank_bracket;
    END IF;
END $$;

-- If processedAt exists, rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'processedAt'
    ) THEN
        ALTER TABLE matches RENAME COLUMN "processedAt" TO processed_at;
    END IF;
END $$;

-- Verify the changes
\d matches
