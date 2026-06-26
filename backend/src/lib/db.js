const mysql = require('mysql2/promise');
require('dotenv').config();

// Extract connection details from DATABASE_URL if needed, 
// or use the string directly if the driver supports it well.
// mysql://root:password@localhost:3306/marjane_wallet

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Resilience: Handle pool errors
pool.on('error', (err) => {
    console.error('CRITICAL: Unexpected database pool error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused.');
    }
});

/**
 * MySQL-compatible helper to add a column only if it doesn't already exist.
 * Uses INFORMATION_SCHEMA to check before ALTER TABLE (works on MySQL and MariaDB).
 */
async function ensureColumn(table, column, definition) {
    try {
        const [rows] = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [table, column]
        );
        if (rows.length === 0) {
            await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
            console.log(`Schema: Added column ${table}.${column}`);
        }
    } catch (err) {
        console.warn(`Schema warning (${table}.${column}): ${err.message}`);
    }
}

/**
 * MySQL-compatible helper to create a table only if it doesn't exist.
 */
async function ensureTable(createSql) {
    try {
        await pool.query(createSql);
    } catch (err) {
        console.warn(`Schema warning (create table): ${err.message}`);
    }
}

module.exports = pool;
module.exports.ensureColumn = ensureColumn;
module.exports.ensureTable = ensureTable;
