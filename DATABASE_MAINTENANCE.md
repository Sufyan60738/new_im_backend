# Database Maintenance Guide

## MySQL Index Limit Issue

MySQL has a hard limit of **64 indexes per table**. When using Sequelize with `sync({ alter: true })`, it can create duplicate indexes over time instead of replacing existing ones, eventually hitting this limit.

### Symptoms
- Error: `Too many keys specified; max 64 keys allowed`
- Application fails to start during database sync
- Error occurs when trying to add/modify indexes

### Solution

#### 1. Clean Up Duplicate Indexes

Run the SQL cleanup script to remove all duplicate indexes:

```sql
-- Open your MySQL client and run:
source RUNTHIS_drop_indexes.sql
```

Or execute the script manually in MySQL Workbench, phpMyAdmin, or command line.

#### 2. Prevent Future Index Accumulation

The `src/models/index.js` has been updated to use `sync({ alter: false })` by default. This prevents automatic schema alterations that can create duplicate indexes.

**To enable alter mode** (only when you need schema changes):
```bash
DB_SYNC_ALTER=true node index.js
```

### Best Practices

1. **Use Migrations Instead of Sync**
   - For production environments, use proper database migrations
   - Sequelize sync is best for development only

2. **Check Index Count Regularly**
   ```sql
   SELECT COUNT(DISTINCT INDEX_NAME) as total_indexes
   FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = 'new_inventory_managment'
   AND TABLE_NAME = 'users';
   ```

3. **Clean Up Before Schema Changes**
   - Before running `alter: true`, check existing indexes
   - Drop unnecessary indexes first

4. **Monitor Index Usage**
   ```sql
   -- Show all indexes on a table
   SHOW INDEX FROM users;
   ```

## Common Index-Related Issues

### Duplicate Indexes
**Problem**: Multiple indexes with similar names (e.g., `email`, `email_2`, `email_3`)  
**Solution**: Drop all and let Sequelize recreate them

### Foreign Key Indexes
**Problem**: Foreign key constraints automatically create indexes  
**Solution**: Define indexes explicitly in models to control naming

### Unique Constraints
**Problem**: Each unique constraint creates an index  
**Solution**: Use `unique: true` in model definition, not separate indexes

## Recovery Commands

If you encounter index limit errors:

```bash
# 1. Run the cleanup script
node simple_drop_indexes.js

# 2. Or use SQL directly
mysql -u root -p new_inventory_managment < RUNTHIS_drop_indexes.sql

# 3. Start the application (indexes will be recreated)
node index.js
```

## Files Reference

- `RUNTHIS_drop_indexes.sql` - Main cleanup SQL script
- `simple_drop_indexes.js` - Node.js cleanup script
- `src/models/index.js` - Updated with safer sync strategy
