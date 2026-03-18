const mysql = require('mysql2/promise');
require('dotenv').config();

// Extract connection details from DATABASE_URL if needed, 
// or use the string directly if the driver supports it well.
// mysql://root:password@localhost:3306/marjane_wallet

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
