/**
 * FINAL FIX: Drop all indexes from users table and let the application recreate them
 * This uses the old MySQL connection pool which we know works
 */

const db = require('./src/config/db').promise();

async function dropAllUserIndexes() {
    console.log('🔧 Dropping all non-PRIMARY indexes from users table...\n');

    try {
        // Get list of all non-PRIMARY indexes
        const [indexes] = await db.query(`
            SELECT DISTINCT INDEX_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'users'
            AND INDEX_NAME != 'PRIMARY'
            ORDER BY INDEX_NAME
        `);

        if (indexes.length === 0) {
            console.log('✅ No indexes to drop. Table is clean!');
            process.exit(0);
        }

        console.log(`Found ${indexes.length} indexes to drop:\n`);
        indexes.forEach(idx => console.log(`  - ${idx.INDEX_NAME}`));
        console.log('');

        // Drop each index
        let success = 0;
        for (const idx of indexes) {
            try {
                await db.query(`ALTER TABLE users DROP INDEX \`${idx.INDEX_NAME}\``);
                console.log(`✓ Dropped: ${idx.INDEX_NAME}`);
                success++;
            } catch (err) {
                console.log(`✗ Failed to drop ${idx.INDEX_NAME}: ${err.message}`);
            }
        }

        console.log(`\n✅ Successfully dropped ${success}/${indexes.length} indexes`);
        console.log('\nNow Sequelize will recreate only the necessary indexes when you run:');
        console.log('  node index.js\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

dropAllUserIndexes();
