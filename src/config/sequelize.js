const { Sequelize } = require('sequelize');

/**
 * Sequelize Database Configuration
 * Creates a Sequelize instance with connection pooling
 */

const sequelize = new Sequelize(
    process.env.DB_NAME || 'new_inventory_managment',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3307,
        dialect: 'mysql',

        // Connection pooling configuration
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },

        // Logging configuration
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

        // Timezone configuration
        timezone: '+05:00', // Pakistan timezone

        // Define default options
        define: {
            timestamps: true,
            underscored: false,
            freezeTableName: true, // Prevent Sequelize from pluralizing table names
        }
    }
);

// Test connection (exported for manual call)
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Sequelize: MySQL database connection established successfully');
        return true;
    } catch (error) {
        console.error('⚠️  Sequelize: Unable to connect to the database');
        console.error('   Error:', error.message);
        console.error('   Converted controllers (Category, Unit, Vendor, Auth) will NOT work');
        console.error('   Old controllers will continue to work if MySQL is running');
        return false;
    }
};

module.exports = sequelize;
module.exports.testConnection = testConnection;
