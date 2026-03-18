const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function diagnose() {
    console.log('--- USERS TABLE DIAGNOSTIC START ---');
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        const [rows] = await connection.query('DESCRIBE users');
        console.table(rows);
        await connection.end();
    } catch (err) {
        console.error('DIAGNOSTIC ERROR:', err.message);
    }
    console.log('--- DIAGNOSTIC END ---');
    process.exit(0);
}

diagnose();
