const mysql = require('mysql2');

// Simple synchronous approach
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new_inventory_managment',
    port: 3307
});

connection.connect((err) => {
    if (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }

    console.log('✅ Connected to database\n');
    console.log('Fetching all indexes on users table...\n');

    // Get all indexes
    connection.query(`
        SELECT DISTINCT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = 'new_inventory_managment'
        AND TABLE_NAME = 'users'
        AND INDEX_NAME != 'PRIMARY'
    `, (err, results) => {
        if (err) {
            console.error('Query failed:', err.message);
            connection.end();
            process.exit(1);
        }

        console.log(`Found ${results.length} indexes to drop\n`);

        if (results.length === 0) {
            console.log('No indexes to drop!');
            connection.end();
            return;
        }

        // Drop each index one by one
        let dropped = 0;
        results.forEach((row, index) => {
            const indexName = row.INDEX_NAME;
            connection.query(`ALTER TABLE users DROP INDEX \`${indexName}\``, (err) => {
                if (err) {
                    console.log(`✗ ${indexName}: ${err.message}`);
                } else {
                    console.log(`✓ Dropped: ${indexName}`);
                    dropped++;
                }

                // Close connection after last one
                if (index === results.length - 1) {
                    console.log(`\n✅ Dropped ${dropped}/${results.length} indexes successfully\n`);
                    connection.end();
                }
            });
        });
    });
});
