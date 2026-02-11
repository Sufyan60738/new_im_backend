/**
 * Quick fix script to drop all indexes from users table except PRIMARY
 * Then let Sequelize recreate them correctly on next sync
 */

const db = require('./src/config/db');

async function quickFix() {
    try {
        console.log('🔧 Quick fix: Dropping all indexes from users table...\n');

        // Get all indexes
        const query = `
            SELECT DISTINCT INDEX_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = 'new_inventory_managment'
            AND TABLE_NAME = 'users'
            AND INDEX_NAME != 'PRIMARY'
        `;

        db.query(query, async (err, results) => {
            if (err) {
                console.error('❌ Error getting indexes:', err.message);
                process.exit(1);
            }

            console.log(`Found ${results.length} non-primary indexes to drop\n`);

            let dropped = 0;
            let errors = 0;

            for (const row of results) {
                const indexName = row.INDEX_NAME;
                const dropQuery = `ALTER TABLE users DROP INDEX \`${indexName}\``;

                await new Promise((resolve) => {
                    db.query(dropQuery, (err) => {
                        if (err) {
                            console.log(`✗ Failed to drop ${indexName}: ${err.message}`);
                            errors++;
                        } else {
                            console.log(`✓ Dropped ${indexName}`);
                            dropped++;
                        }
                        resolve();
                    });
                });
            }

            console.log(`\n✅ Dropped ${dropped} indexes (${errors} errors)`);
            console.log('\nNow run: node index.js');
            console.log('Sequelize will recreate the necessary indexes automatically.\n');

            db.end();
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

quickFix();
