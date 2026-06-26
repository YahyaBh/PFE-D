const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const { logAudit } = require('../lib/auditLogger');
const ledgerService = require('../services/ledgerService');
const logger = require('../lib/logger');

// Schema handled by migrations
const fixMerchantSchema = async () => {};
fixMerchantSchema();

/**
 * Merchant Controller - Handle business operations
 */
const getMerchantStats = async (req, res) => {
    const userId = req.user.id;

    try {
        const [merchantUsers] = await db.query(
            'SELECT mu.*, m.name as merchantName, m.status as merchantStatus FROM merchant_users mu JOIN merchants m ON mu.merchant_id = m.id WHERE mu.user_id = ?',
            [userId]
        );

        if (merchantUsers.length === 0) {
            return res.status(403).json({ error: 'Merchant access denied' });
        }

        const merchant = merchantUsers[0];

        const [wallets] = await db.query('SELECT * FROM merchant_wallets WHERE merchant_id = ?', [merchant.merchant_id]);

        const merchantWalletId = wallets[0]?.id;

        // Total revenue, transaction count, avg order, unique customers
        const [stats] = await db.query(`
            SELECT 
                COALESCE(SUM(amount), 0) as totalRevenue,
                COUNT(*) as transactionCount,
                COALESCE(AVG(amount), 0) as avgOrder,
                COUNT(DISTINCT t.sender_wallet_id) as uniqueCustomers
            FROM transactions t
            WHERE t.receiver_wallet_id = ?
            AND t.status = 'COMPLETED'
        `, [merchantWalletId]);

        const [sales] = await db.query(`
            SELECT 
                DATE(created_at) as date, 
                SUM(amount) as volume, 
                COUNT(*) as count 
            FROM transactions 
            WHERE receiver_wallet_id = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND status = 'COMPLETED'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [merchantWalletId]);

        const [recentTxs] = await db.query(`
            SELECT t.*, u.name as customerName 
            FROM transactions t
            LEFT JOIN wallet_accounts w ON t.sender_wallet_id = w.id
            LEFT JOIN users u ON w.user_id = u.id
            WHERE t.receiver_wallet_id = ?
            ORDER BY t.created_at DESC
            LIMIT 10
        `, [merchantWalletId]);

        res.json({
            merchantName: merchant.merchantName,
            merchant: merchant,
            wallet: wallets[0] || { balance: 0, currency: 'MAD' },
            availableBalance: wallets[0] ? parseFloat(wallets[0].balance) : 0,
            totalRevenue: parseFloat(stats[0].totalRevenue),
            transactionCount: parseInt(stats[0].transactionCount),
            avgOrder: parseFloat(stats[0].avgOrder),
            uniqueCustomers: parseInt(stats[0].uniqueCustomers),
            salesAnalytics: sales,
            recentTransactions: recentTxs
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch merchant stats' });
    }
};

const getSalesChart = async (req, res) => {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    let interval;
    switch (period) {
        case 'quarter': interval = '3 MONTH'; break;
        case 'year': interval = '12 MONTH'; break;
        case '30d':
        default: interval = '30 DAY'; break;
    }

    try {
        const [merchantUsers] = await db.query('SELECT merchant_id FROM merchant_users WHERE user_id = ?', [userId]);
        if (merchantUsers.length === 0) return res.status(403).json({ error: 'Merchant access denied' });

        const [wallets] = await db.query('SELECT id FROM merchant_wallets WHERE merchant_id = ?', [merchantUsers[0].merchant_id]);
        if (wallets.length === 0) return res.json([]);

        const [rows] = await db.query(`
            SELECT DATE(created_at) as date, SUM(amount) as revenue, COUNT(*) as count
            FROM transactions
            WHERE receiver_wallet_id = ?
            AND status = 'COMPLETED'
            AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [wallets[0].id]);

        res.json(rows);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch sales chart' });
    }
};

const getLatestSales = async (req, res) => {
    const userId = req.user.id;
    const { limit = 5 } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    try {
        const [merchantUsers] = await db.query('SELECT merchant_id FROM merchant_users WHERE user_id = ?', [userId]);
        if (merchantUsers.length === 0) return res.status(403).json({ error: 'Merchant access denied' });

        const [wallets] = await db.query('SELECT id FROM merchant_wallets WHERE merchant_id = ?', [merchantUsers[0].merchant_id]);
        if (wallets.length === 0) return res.json([]);

        const [rows] = await db.query(`
            SELECT t.id, t.amount, t.currency, t.type, t.status, t.created_at,
                   u.name as customerName
            FROM transactions t
            LEFT JOIN wallet_accounts w ON t.sender_wallet_id = w.id
            LEFT JOIN users u ON w.user_id = u.id
            WHERE t.receiver_wallet_id = ?
            ORDER BY t.created_at DESC
            LIMIT ?
        `, [wallets[0].id, limitNum]);

        res.json(rows);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch latest sales' });
    }
};

const getMerchantTransactionsPaginated = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, search, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    try {
        const [merchantUsers] = await db.query('SELECT merchant_id FROM merchant_users WHERE user_id = ?', [userId]);
        if (merchantUsers.length === 0) return res.status(403).json({ error: 'Merchant access denied' });

        const [wallets] = await db.query('SELECT id FROM merchant_wallets WHERE merchant_id = ?', [merchantUsers[0].merchant_id]);
        if (wallets.length === 0) {
            return res.json({ transactions: [], total: 0, page: pageNum, totalPages: 0 });
        }

        const walletId = wallets[0].id;
        let conditions = ['t.receiver_wallet_id = ?'];
        let params = [walletId];

        if (status) {
            conditions.push('t.status = ?');
            params.push(status);
        }

        if (search) {
            conditions.push('(t.id LIKE ? OR u.name LIKE ?)');
            const pattern = `%${search}%`;
            params.push(pattern, pattern);
        }

        const whereClause = conditions.join(' AND ');

        const [countResult] = await db.query(`
            SELECT COUNT(*) as total
            FROM transactions t
            LEFT JOIN wallet_accounts w ON t.sender_wallet_id = w.id
            LEFT JOIN users u ON w.user_id = u.id
            WHERE ${whereClause}
        `, params);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limitNum);

        const [transactions] = await db.query(`
            SELECT t.*, u.name as customerName, u.email as customerEmail
            FROM transactions t
            LEFT JOIN wallet_accounts w ON t.sender_wallet_id = w.id
            LEFT JOIN users u ON w.user_id = u.id
            WHERE ${whereClause}
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);

        res.json({ transactions, total, page: pageNum, totalPages });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch merchant transactions' });
    }
};

const getMerchantTransactions = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, search, status } = req.query;

    if (page || limit || search || status) {
        return getMerchantTransactionsPaginated(req, res);
    }

    try {
        const [merchantUsers] = await db.query('SELECT merchant_id FROM merchant_users WHERE user_id = ?', [userId]);
        if (merchantUsers.length === 0) return res.status(403).json({ error: 'Merchant access denied' });

        const [transactions] = await db.query(`
            SELECT t.*, u.name as customerName, u.email as customerEmail
            FROM transactions t
            LEFT JOIN wallet_accounts w ON t.sender_wallet_id = w.id
            LEFT JOIN users u ON w.user_id = u.id
            WHERE t.receiver_wallet_id = (SELECT id FROM merchant_wallets WHERE merchant_id = ?)
            ORDER BY t.created_at DESC
            LIMIT 100
        `, [merchantUsers[0].merchant_id]);

        res.json(transactions);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch merchant transactions' });
    }
};

const getSettlements = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    try {
        const [merchantUsers] = await db.query('SELECT merchant_id FROM merchant_users WHERE user_id = ?', [userId]);
        if (merchantUsers.length === 0) return res.status(403).json({ error: 'Merchant access denied' });

        let conditions = ['merchant_id = ?'];
        let params = [merchantUsers[0].merchant_id];

        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }

        const whereClause = conditions.join(' AND ');

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM merchant_settlements WHERE ${whereClause}`,
            params
        );

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limitNum);

        const [settlements] = await db.query(
            `SELECT * FROM merchant_settlements WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limitNum, offset]
        );

        res.json({ settlements, total, page: pageNum, totalPages });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch settlements' });
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

        await connection.query('UPDATE merchant_wallets SET balance = balance - ? WHERE merchant_id = ?', [amount, merchantId]);

        const settlementId = uuidv4();
        const bankInfoJson = bankInfo ? JSON.stringify(bankInfo) : null;
        await connection.query(
            'INSERT INTO merchant_settlements (id, merchant_id, amount, bank_info, status) VALUES (?, ?, ?, ?, ?)',
            [settlementId, merchantId, amount, bankInfoJson, 'PENDING']
        );

        await ledgerService.recordTransaction(connection, settlementId, [
           { accountId: wallet.id, amount: -parseFloat(amount), description: `Settlement Request: ${settlementId}` },
           { accountId: 'system-bank-account', amount: parseFloat(amount), description: `Merchant Settlement Provision: ${merchantId}` }
        ]);

        await connection.commit();
        await logAudit(req, 'MERCHANT_SETTLEMENT_REQUESTED', 'merchant', merchantId, { amount });

        res.json({ message: 'Settlement request submitted successfully', settlementId });
    } catch (err) {
        await connection.rollback();
        logger.error(err);
        res.status(500).json({ error: 'Server error during settlement' });
    } finally {
        connection.release();
    }
};

const requestOnboarding = async (req, res) => {
    const { name, description, category } = req.body;
    const userId = req.user.id;

    if (!name) return res.status(400).json({ error: 'Business name is required' });

    try {
        const [existing] = await db.query('SELECT id FROM merchant_users WHERE user_id = ?', [userId]);
        if (existing.length > 0) return res.status(400).json({ error: 'You are already associated with a merchant account' });

        const merchantId = uuidv4();
        await db.query(
            'INSERT INTO merchants (id, name, description, category, status) VALUES (?, ?, ?, ?, ?)',
            [merchantId, name, description || null, category || null, 'PENDING_APPROVAL']
        );

        const linkId = uuidv4();
        await db.query(
            'INSERT INTO merchant_users (id, merchant_id, user_id, role) VALUES (?, ?, ?, ?)',
            [linkId, merchantId, userId, 'OWNER']
        );

        await logAudit(req, 'MERCHANT_ONBOARDING_REQUESTED', 'merchant', merchantId, { name });

        res.json({ message: 'Your merchant application has been submitted for review.', merchantId });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to submit merchant application' });
    }
};

const qrLookup = async (req, res) => {
    const { merchantId } = req.query;
    if (!merchantId) return res.status(400).json({ error: 'merchantId query param required' });

    try {
        const [merchants] = await db.query(
            'SELECT m.name as businessName, mu.user_id as ownerId FROM merchants m JOIN merchant_users mu ON mu.merchant_id = m.id WHERE m.id = ?',
            [merchantId]
        );
        if (merchants.length === 0) return res.status(404).json({ error: 'Merchant not found' });

        res.json({ businessName: merchants[0].businessName, ownerId: merchants[0].ownerId });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to lookup merchant' });
    }
};

const getQRCode = async (req, res) => {
    const userId = req.user.id;

    try {
        const [merchantUsers] = await db.query(
            'SELECT mu.merchant_id, m.name as businessName FROM merchant_users mu JOIN merchants m ON mu.merchant_id = m.id WHERE mu.user_id = ?',
            [userId]
        );

        if (merchantUsers.length === 0) return res.status(403).json({ error: 'Merchant access denied' });

        res.json({
            merchantId: merchantUsers[0].merchant_id,
            businessName: merchantUsers[0].businessName,
            type: 'static'
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to generate QR code data' });
    }
};

const generateCustomQR = async (req, res) => {
    const { amount, description } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
    }

    try {
        const [merchantUsers] = await db.query(
            'SELECT mu.merchant_id FROM merchant_users mu WHERE mu.user_id = ?',
            [userId]
        );

        if (merchantUsers.length === 0) return res.status(403).json({ error: 'Merchant access denied' });

        res.json({
            merchantId: merchantUsers[0].merchant_id,
            type: 'dynamic',
            amount: parseFloat(amount),
            description: description || null
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to generate custom QR' });
    }
};

/**
 * Lightweight merchant status check for the current user
 */
const getMerchantStatus = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT m.id, m.name, m.status, m.category, m.created_at,
                    mw.balance as wallet_balance, mw.currency as wallet_currency
             FROM merchant_users mu
             JOIN merchants m ON mu.merchant_id = m.id
             LEFT JOIN merchant_wallets mw ON mw.merchant_id = m.id
             WHERE mu.user_id = ?`,
            [req.user.id]
        );
        if (rows.length === 0) return res.json({ merchant: null });
        res.json({ merchant: rows[0] });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to get merchant status' });
    }
};

module.exports = {
    getMerchantStats,
    requestSettlement,
    getMerchantTransactions,
    getSettlements,
    requestOnboarding,
    qrLookup,
    getMerchantStatus,
    getSalesChart,
    getLatestSales,
    getQRCode,
    generateCustomQR
};
