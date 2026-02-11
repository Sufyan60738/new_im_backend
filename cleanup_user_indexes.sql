-- ============================================
-- Cleanup Script for Users Table Indexes
-- Purpose: Remove ALL duplicate indexes to fix "Too many keys" error
-- Database: new_inventory_managment
-- Table: users
-- ============================================

USE new_inventory_managment;

-- This dynamic script will drop ALL indexes except PRIMARY
-- Run this to generate DROP statements
SET SESSION group_concat_max_len = 100000;

SELECT GROUP_CONCAT(
    CONCAT('ALTER TABLE users DROP INDEX `', INDEX_NAME, '`;')
    SEPARATOR '\n'
) AS drop_statements
FROM (
    SELECT DISTINCT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'new_inventory_managment'
    AND TABLE_NAME = 'users'
    AND INDEX_NAME != 'PRIMARY'
) AS indexes;

-- After running the above to see what will be dropped,
-- Execute the following to actually drop all non-primary indexes:

-- Note: Copy and paste the output from above and run it,
-- OR manually run the statements below if you prefer:

-- Manual cleanup (these are common Sequelize index names):
-- You may need to run this multiple times if there are duplicate numbered indexes like email_2, email_3, etc.

