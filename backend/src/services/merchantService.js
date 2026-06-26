const db = require('../lib/db');

const merchantService = {
  async getMerchantByUserId(userId) {
    const [rows] = await db.query(
      `SELECT mu.*, m.name as businessName, m.status, m.category 
       FROM merchant_users mu 
       JOIN merchants m ON mu.merchant_id = m.id 
       WHERE mu.user_id = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  async getMerchantWallet(merchantId) {
    const [rows] = await db.query(
      'SELECT * FROM merchant_wallets WHERE merchant_id = ?',
      [merchantId]
    );
    return rows[0] || null;
  },

  async recordLedgerEntry(connection, transactionId, entries) {
    const { v4: uuidv4 } = require('uuid');
    for (const entry of entries) {
      const entryId = uuidv4();
      await connection.query(
        'INSERT INTO ledger_entries (id, transaction_id, account_id, amount, description) VALUES (?, ?, ?, ?, ?)',
        [entryId, transactionId, entry.accountId, entry.amount, entry.description]
      );
      await connection.query(
        'UPDATE ledger_accounts SET balance = balance + ? WHERE id = ?',
        [entry.amount, entry.accountId]
      );
    }
  }
};

module.exports = merchantService;
