const sequelize = require('./src/config/sequelize');

async function checkIndexes() {
    try {
        const [results] = await sequelize.query('SHOW INDEX FROM users');

        console.log('\n📊 User Table Indexes:');
        console.log('Total indexes:', results.length);
        console.log('\n');

        // Group by index name
        const indexGroups = {};
        results.forEach(row => {
            if (!indexGroups[row.Key_name]) {
                indexGroups[row.Key_name] = [];
            }
            indexGroups[row.Key_name].push(row);
        });

        console.log('Unique index names:', Object.keys(indexGroups).length);
        console.log('\nIndex breakdown:');
        Object.keys(indexGroups).forEach(indexName => {
            const columns = indexGroups[indexName].map(r => r.Column_name).join(', ');
            const unique = indexGroups[indexName][0].Non_unique === 0 ? 'UNIQUE' : 'NON-UNIQUE';
            console.log(`  - ${indexName} (${unique}): [${columns}]`);
        });

        await sequelize.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkIndexes();
