const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',       // your MySQL host
  user: 'root',            // your MySQL username
  password: '',            // your MySQL password
  database: 'inventory_management'  // your database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as ID ' + db.threadId);
});

module.exports = db;
