-- Fix column names in matches table to match Prisma schema
-- Run this if you get "column m.match_id does not exist" errors

-- Check current column names first:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'matches';

-- If matchId column exists (camelCase), rename it to match_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'matchId'
    ) THEN
        ALTER TABLE matches RENAME COLUMN "matchId" TO match_id;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'queueId'
    ) THEN
        ALTER TABLE matches RENAME COLUMN "queueId" TO queue_id;
    END IF;
END $$;

-- Verify the fix:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'matches';
