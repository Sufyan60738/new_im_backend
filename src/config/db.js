const mysql = require('mysql2');

/**
 * Database Connection Pool
 * Using connection pool for better performance and scalability
 * Supports both callback and promise-based queries
 */

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'new_inventory_managment',
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('⚠️  Old MySQL connection failed:', err.message);
    console.error('   Old controllers may not work, but server will continue...');
    return;
  }
  console.log('✅ Connected to MySQL database (old connection pool)');
  connection.release();
});

// Export pool with both callback and promise support
module.exports = pool;
