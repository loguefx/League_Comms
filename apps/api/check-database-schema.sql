-- Check current database schema for matches table
-- Run this in pgAdmin to see what columns actually exist

SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;
