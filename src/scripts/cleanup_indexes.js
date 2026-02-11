const mysql = require('mysql2/promise');

/**
 * Comprehensive script to clean up duplicate indexes on the users table
 * This is a standalone script that doesn't rely on Sequelize
 */

async function cleanupUserIndexes() {
    let connection;

    try {
        console.log('🔧 Starting index cleanup for users table...\n');

        // Create database connection using same config as Sequelize
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3307,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'new_inventory_managment'
        });

        console.log('✅ Connected to MySQL database\n');

        // Step 1: Check current indexes
        console.log('📊 Step 1: Checking current indexes...');
        const [currentIndexes] = await connection.query(`
            SELECT 
                INDEX_NAME, 
                GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns,
                CASE WHEN NON_UNIQUE = 0 THEN 'UNIQUE' ELSE 'NON-UNIQUE' END as index_type
            FROM 
                information_schema.STATISTICS 
            WHERE 
                TABLE_SCHEMA = 'new_inventory_managment' 
                AND TABLE_NAME = 'users'
            GROUP BY 
                INDEX_NAME, NON_UNIQUE
            ORDER BY 
                INDEX_NAME
        `);

        console.log(`   Found ${currentIndexes.length} indexes:\n`);
        currentIndexes.forEach(idx => {
            console.log(`   - ${idx.INDEX_NAME} (${idx.index_type}): [${idx.columns}]`);
        });

        if (currentIndexes.length <= 6) {
            console.log('\n✅ Index count is already optimal. No cleanup needed.');
            await connection.end();
            return;
        }

        console.log(`\n⚠️  Warning: Found ${currentIndexes.length} indexes. MySQL limit is 64, but optimal is 6.`);

        // Step 2: Drop all non-primary indexes
        console.log('\n🗑️  Step 2: Dropping all non-primary indexes...');
        const indexesToDrop = currentIndexes
            .filter(idx => idx.INDEX_NAME !== 'PRIMARY')
            .map(idx => idx.INDEX_NAME);

        console.log(`   Will drop ${indexesToDrop.length} indexes...\n`);

        for (const indexName of indexesToDrop) {
            try {
                await connection.query(`ALTER TABLE users DROP INDEX \`${indexName}\``);
                console.log(`   ✓ Dropped index: ${indexName}`);
            } catch (err) {
                if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.log(`   ⚠ Index ${indexName} does not exist, skipping...`);
                } else {
                    console.error(`   ✗ Error dropping ${indexName}:`, err.message);
                }
            }
        }

        // Step 3: Recreate necessary indexes
        console.log('\n🔨 Step 3: Creating necessary indexes...');

        const indexesToCreate = [
            { name: 'idx_users_email', columns: 'email', unique: true },
            { name: 'idx_users_shop_id', columns: 'shop_id', unique: false },
            { name: 'idx_users_branch_id', columns: 'branch_id', unique: false },
            { name: 'idx_users_role', columns: 'role', unique: false },
            { name: 'idx_users_is_active', columns: 'is_active', unique: false }
        ];

        for (const index of indexesToCreate) {
            try {
                const uniqueClause = index.unique ? 'UNIQUE' : '';
                await connection.query(
                    `ALTER TABLE users ADD ${uniqueClause} INDEX \`${index.name}\` (\`${index.columns}\`)`
                );
                console.log(`   ✓ Created index: ${index.name} (${index.unique ? 'UNIQUE' : 'NON-UNIQUE'})`);
            } catch (err) {
                if (err.code === 'ER_DUP_KEYNAME') {
                    console.log(`   ⚠ Index ${index.name} already exists, skipping...`);
                } else {
                    console.error(`   ✗ Error creating ${index.name}:`, err.message);
                    throw err;
                }
            }
        }

        // Step 4: Verify final state
        console.log('\n✅ Step 4: Verifying final state...');
        const [finalIndexes] = await connection.query(`
            SELECT 
                INDEX_NAME, 
                GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns,
                CASE WHEN NON_UNIQUE = 0 THEN 'UNIQUE' ELSE 'NON-UNIQUE' END as index_type
            FROM 
                information_schema.STATISTICS 
            WHERE 
                TABLE_SCHEMA = 'new_inventory_managment' 
                AND TABLE_NAME = 'users'
            GROUP BY 
                INDEX_NAME, NON_UNIQUE
            ORDER BY 
                INDEX_NAME
        `);

        console.log(`\n📊 Final index count: ${finalIndexes.length}`);
        finalIndexes.forEach(idx => {
            console.log(`   - ${idx.INDEX_NAME} (${idx.index_type}): [${idx.columns}]`);
        });

        if (finalIndexes.length === 6) {
            console.log('\n🎉 Success! Index cleanup completed. Users table now has the optimal number of indexes.');
            console.log('   You can now run: node index.js');
        } else {
            console.log(`\n⚠️  Warning: Expected 6 indexes but found ${finalIndexes.length}. Please review.`);
        }

        await connection.end();
        console.log('\n✅ Database connection closed.');

    } catch (error) {
        console.error('\n❌ Error during index cleanup:');
        console.error('   Message:', error.message);
        console.error('   Code:', error.code);

        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Tip: Make sure MySQL server is running on port', process.env.DB_PORT || 3307);
        }

        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

// Run the cleanup
cleanupUserIndexes();
