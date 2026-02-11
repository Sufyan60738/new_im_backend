-- Script to identify and drop duplicate/unnecessary indexes on the users table

-- First, let's see what indexes exist
SELECT 
    INDEX_NAME, 
    COLUMN_NAME, 
    NON_UNIQUE,
    SEQ_IN_INDEX
FROM 
    information_schema.STATISTICS 
WHERE 
    TABLE_SCHEMA = 'new_inventory_managment' 
    AND TABLE_NAME = 'users'
ORDER BY 
    INDEX_NAME, 
    SEQ_IN_INDEX;

-- Count total indexes
SELECT 
    COUNT(DISTINCT INDEX_NAME) as total_indexes
FROM 
    information_schema.STATISTICS 
WHERE 
    TABLE_SCHEMA = 'new_inventory_managment' 
    AND TABLE_NAME = 'users';
