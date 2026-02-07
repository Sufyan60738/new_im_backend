-- ========================================
-- Drop units Table
-- ========================================
-- This SQL script drops the units table since we're now using only predefined_units
-- Execute this in your MySQL/phpMyAdmin

DROP TABLE IF EXISTS `units`;

-- Verify the table is dropped
SHOW TABLES LIKE 'units';  
-- Should return empty result

-- Verify predefined_units table still exists
SHOW TABLES LIKE 'predefined_units';  
-- Should return 'predefined_units'

-- Check predefined_units data
SELECT COUNT(*) as total_units FROM predefined_units;
SELECT category, COUNT(*) as count 
FROM predefined_units 
GROUP BY category 
ORDER BY category;
