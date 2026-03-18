const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function migrate() {
    process.stdout.write('Dual Verification Migration starting...\n');
    const dbUrl = process.env.DATABASE_URL;
    
    try {
        const connection = await mysql.createConnection(dbUrl);
        process.stdout.write('Connected to Database.\n');
        
        const queries = [
            "ALTER TABLE users ADD COLUMN isEmailVerified BOOLEAN DEFAULT FALSE AFTER tier;",
            "ALTER TABLE users ADD COLUMN isPhoneVerified BOOLEAN DEFAULT FALSE AFTER isEmailVerified;",
            "ALTER TABLE users ADD COLUMN emailVerificationCode VARCHAR(6) AFTER isPhoneVerified;",
            "ALTER TABLE users ADD COLUMN phoneVerificationCode VARCHAR(6) AFTER emailVerificationCode;",
            "ALTER TABLE users ADD COLUMN verificationExpires DATETIME AFTER phoneVerificationCode;"
        ];

        for (const query of queries) {
            try {
                await connection.query(query);
                process.stdout.write(`SUCCESS: Executed ${query}\n`);
            } catch (err) {
                process.stdout.write(`SKIP: ${err.message}\n`);
            }
        }
        
        await connection.end();
        process.stdout.write('Migration finished.\n');
    } catch (err) {
        process.stdout.write('CRITICAL ERROR: ' + err.message + '\n');
    }
    process.exit(0);
}

migrate();
