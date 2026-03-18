const db = require('../src/lib/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function main() {
  const hashedPassword = await bcrypt.hash('marjane2026', 10);
  const userId = uuidv4();
  const walletId = uuidv4();
  
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', ['demo@marjane.ma']);
    
    if (existing.length === 0) {
      await db.query(
        'INSERT INTO users (id, email, password, name, phone) VALUES (?, ?, ?, ?, ?)',
        [userId, 'demo@marjane.ma', hashedPassword, 'Soufiane Demo', '+212 600-000000']
      );

      await db.query(
        'INSERT INTO wallets (id, userId, balance, currency) VALUES (?, ?, ?, ?)',
        [walletId, userId, 15480.50, 'MAD']
      );
      console.log('--- Demo Account Created ---');
    } else {
      console.log('--- Demo Account Already Exists ---');
    }

    console.log('Email: demo@marjane.ma');
    console.log('Password: marjane2026');
    console.log('MFA Code: 123456');
    console.log('---------------------------');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

main();
