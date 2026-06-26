const db = require('../lib/db');

const walletRepository = {
    async findByUserId(userId, connection = db, forUpdate = false) {
        let query = 'SELECT id, user_id, balance, currency, type, status, label FROM wallet_accounts WHERE user_id = ?';
        if (forUpdate) {
            query += ' FOR UPDATE';
        }
        const [rows] = await connection.query(query, [userId]);
        return rows.length > 0 ? rows : [];
    },

    async findByUserIdAndCurrency(userId, currency, connection = db, forUpdate = false) {
        let query = 'SELECT id, user_id, balance, currency, type, status FROM wallet_accounts WHERE user_id = ? AND currency = ?';
        if (forUpdate) {
            query += ' FOR UPDATE';
        }
        const [rows] = await connection.query(query, [userId, currency]);
        return rows[0] || null;
    },

    async updateBalance(walletId, amount, connection = db) {
        const [result] = await connection.query(
            'UPDATE wallet_accounts SET balance = balance + ? WHERE id = ?',
            [amount, walletId]
        );
        return result.affectedRows > 0;
    },

    async create(walletId, userId, currency, type = 'fiat', status = 'active', label = null, connection = db) {
        await connection.query(
            'INSERT INTO wallet_accounts (id, user_id, currency, balance, type, status, label) VALUES (?, ?, ?, 0, ?, ?, ?)',
            [walletId, userId, currency, type, status, label || `${currency} ${type === 'crypto' ? 'Vault' : 'Wallet'}`]
        );
    },

};

module.exports = walletRepository;
