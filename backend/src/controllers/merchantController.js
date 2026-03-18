const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const { logAudit } = require('../lib/auditLogger');
const ledgerService = require('../services/ledgerService');

/**
 * Merchant Controller - Handle business operations
 */
const getMerchantStats = async (req, res) => {
    const userId = req.user.id;

    try {
        // 1. Get Merchant Info
        const [merchantUsers] = await db.query(
            'SELECT mu.*, m.name as merchantName FROM merchant_users mu JOIN merchants m ON mu.merchant_id = m.id WHERE mu.user_id = ?',
            [userId]
        );

        if (merchantUsers.length === 0) {
            return res.status(403).json({ error: 'Merchant access denied' });
        }

        const merchant = merchantUsers[0];

        // 2. Get Wallet Balance
        const [wallets] = await db.query('SELECT * FROM merchant_wallets WHERE merchant_id = ?', [merchant.merchant_id]);
        
        // 3. Get Recent Sales (Last 30 days)
        const [sales] = await db.query(`
            SELECT 
                DATE(created_at) as date, 
                SUM(amount) as volume, 
                COUNT(*) as count 
            FROM transactions 
            WHERE receiver_wallet_id = (SELECT id FROM merchant_wallets WHERE merchant_id = ?)
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND status = 'COMPLETED'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [merchant.merchant_id]);

        // 4. Get Latest Transactions
        const [recentTxs] = await db.query(`
            SELECT t.*, u.name as customerName 
            FROM transactions t
            LEFT JOIN wallets w ON t.sender_wallet_id = w.id
            LEFT JOIN users u ON w.user_id = u.id
            WHERE t.receiver_wallet_id = (SELECT id FROM merchant_wallets WHERE merchant_id = ?)
            ORDER BY t.created_at DESC
            LIMIT 10
        `, [merchant.merchant_id]);

        res.json({
            merchant,
            wallet: wallets[0] || { balance: 0, currency: 'MAD' },
            salesAnalytics: sales,
            recentTransactions: recentTxs
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch merchant stats' });
    }
};

const requestSettlement = async (req, res) => {
    const { amount, bankInfo } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid settlement amount' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [merchantUsers] = await connection.query('SELECT merchant_id FROM merchant_users WHERE user_id = ?', [userId]);
        if (merchantUsers.length === 0) {
            await connection.rollback();
            return res.status(403).json({ error: 'Merchant access denied' });
        }
        const merchantId = merchantUsers[0].merchant_id;

        const [wallets] = await connection.query('SELECT * FROM merchant_wallets WHERE merchant_id = ? FOR UPDATE', [merchantId]);
        const wallet = wallets[0];

        if (!wallet || parseFloat(wallet.balance) < parseFloat(amount)) {
            await connection.rollback();
            return res.status(400).json({ error: 'Insufficient merchant balance' });
        }

        // 1. Deduct from Merchant Wallet
        await connection.query('UPDATE merchant_wallets SET balance = balance - ? WHERE merchant_id = ?', [amount, merchantId]);

        // 2. Create Settlement Record
        const settlementId = uuidv4();
        await connection.query(
            'INSERT INTO merchant_settlements (id, merchant_id, amount, status) VALUES (?, ?, ?, ?)',
            [settlementId, merchantId, amount, 'PENDING']
        );

        // 3. Ledger Entry (Debit Merchant, Credit System Bank for Payout)
        await ledgerService.recordTransaction(connection, settlementId, [
           { accountId: wallet.id, amount: -parseFloat(amount), description: `Settlement Request: ${settlementId}` },
           { accountId: 'system-bank-account', amount: parseFloat(amount), description: `Merchant Settlement Provision: ${merchantId}` }
        ]);

        await connection.commit();
        await logAudit(req, 'MERCHANT_SETTLEMENT_REQUESTED', 'merchant', merchantId, { amount });

        res.json({ message: 'Settlement request submitted successfully', settlementId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error during settlement' });
    } finally {
        connection.release();
    }
};

module.exports = {
    getMerchantStats,
    requestSettlement
};
