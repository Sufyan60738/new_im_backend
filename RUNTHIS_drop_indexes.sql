-- ================================================================
-- FINAL FIX: Drop all duplicate indexes from users table
-- Run this script in your MySQL client (e.g., MySQL Workbench, phpMyAdmin, or command line)
-- Database: new_inventory_managment
-- ================================================================

USE new_inventory_managment;

-- First, let's see what we have
SELECT 
    'BEFORE CLEANUP' as status,
    COUNT(DISTINCT INDEX_NAME) as total_indexes
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'new_inventory_managment'
AND TABLE_NAME = 'users';

-- Show all indexes
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    CASE WHEN NON_UNIQUE = 0 THEN 'UNIQUE' ELSE 'NON-UNIQUE' END as type
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'new_inventory_managment'
AND TABLE_NAME = 'users'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- ================================================================  
-- DROP ALL NON-PRIMARY INDEXES
-- These will be recreated correctly when you run: node index.js
-- ================================================================

-- Generate DROP statements dynamically (run this first to see what will be dropped)
SELECT GROUP_CONCAT(
    CONCAT('ALTER TABLE users DROP INDEX `', INDEX_NAME, '`;')
    SEPARATOR '\n'
) AS 'Copy and run these DROP statements:'
FROM (
    SELECT DISTINCT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'new_inventory_managment'
    AND TABLE_NAME = 'users'
    AND INDEX_NAME != 'PRIMARY'
) as idx;

-- ================================================================
-- ALTERNATIVE: Drop indexes manually (if automatic generation doesn't work)
-- Run each line one at a time, ignore errors for indexes that don't exist
-- ================================================================

-- Drop all possible index variations that Sequelize might have created
ALTER TABLE users DROP INDEX IF EXISTS email;
ALTER TABLE users DROP INDEX IF EXISTS email_2;
ALTER TABLE users DROP INDEX IF EXISTS email_3;
ALTER TABLE users DROP INDEX IF EXISTS users_email_unique;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_email;

ALTER TABLE users DROP INDEX IF EXISTS shop_id;
ALTER TABLE users DROP INDEX IF EXISTS shop_id_2;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_shop_id;
ALTER TABLE users DROP INDEX IF EXISTS users_shop_id;

ALTER TABLE users DROP INDEX IF EXISTS branch_id;
ALTER TABLE users DROP INDEX IF EXISTS branch_id_2;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_branch_id;
ALTER TABLE users DROP INDEX IF EXISTS users_branch_id;

ALTER TABLE users DROP INDEX IF EXISTS role;
ALTER TABLE users DROP INDEX IF EXISTS role_2;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_role;
ALTER TABLE users DROP INDEX IF EXISTS users_role;

ALTER TABLE users DROP INDEX IF EXISTS is_active;
ALTER TABLE users DROP INDEX IF EXISTS is_active_2;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_is_active;
ALTER TABLE users DROP INDEX IF EXISTS users_is_active;

-- ================================================================
-- VERIFY: Check final state
-- ================================================================

SELECT 
    'AFTER CLEANUP' as status,
    COUNT(DISTINCT INDEX_NAME) as total_indexes
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'new_inventory_managment'
AND TABLE_NAME = 'users';

-- Expected result: 1 (just PRIMARY key)
-- Sequelize will recreate the 5 necessary indexes when you run: node index.js

SELECT '✅ Done! Now run: node index.js' as next_step;
