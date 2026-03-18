const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Ledger Service - Double Entry Accounting Core
 */
const ledgerService = {
    /**
     * Create balancing double-entry records
     * entries: [{ accountId: string, amount: number, description: string }]
     * amount is positive for credit/inflow, negative for debit/outflow
     */
    async recordTransaction(connection, transactionId, entries) {
        // 1. Verify balance (Sum of all entries must be ZERO)
        const balance = entries.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        if (Math.abs(balance) > 0.001) {
            throw new Error(`Ledger Imbalance: Transaction ${transactionId} is not balanced by ${balance}`);
        }

        for (const entry of entries) {
            const entryId = uuidv4();
            await connection.query(
                'INSERT INTO ledger_entries (id, transaction_id, account_id, amount, description) VALUES (?, ?, ?, ?, ?)',
                [entryId, transactionId, entry.accountId, entry.amount, entry.description]
            );

            // Update account cache balance
            await connection.query(
                'UPDATE ledger_accounts SET balance = balance + ? WHERE id = ?',
                [entry.amount, entry.accountId]
            );
        }
    },

    /**
     * Gets or creates a ledger account for a user wallet
     */
    async getOrCreateWalletAccount(connection, walletId, userId, name = 'User Wallet') {
        const [existing] = await connection.query('SELECT id FROM ledger_accounts WHERE id = ?', [walletId]);
        
        if (existing.length === 0) {
            await connection.query(
                'INSERT INTO ledger_accounts (id, owner_id, name, type, balance) VALUES (?, ?, ?, "ASSET", 0)',
                [walletId, userId, name]
            );
        }
        return walletId;
    }
};

module.exports = ledgerService;
