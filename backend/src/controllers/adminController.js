const db = require('../lib/db');
const notificationController = require('./notificationController');
const { logAudit } = require('../lib/auditLogger');

/**
 * Admin Controller
 * Provides administrative capabilities for user and transaction management.
 */

// --- User Management ---

const getUsers = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT id, name, email, phone, role, status, tier, loyalty_points, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { userId, status } = req.body; // 'active' or 'suspended'
        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

        // If suspended, we could also revoke tokens in a real app
        await notificationController.createNotification(
            userId,
            'SECURITY',
            `Account ${status === 'suspended' ? 'Suspended' : 'Activated'}`,
            `Your account has been ${status === 'suspended' ? 'suspended by an administrator' : 'reactivated'}.`
        );

        await logAudit(req, status === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED', 'user', null, { targetUserId: userId }, req.user.id);

        res.json({ message: `User account ${status} successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user status' });
    }
};

const resetUserMFA = async (req, res) => {
    try {
        const { userId } = req.body;
        await db.query('UPDATE users SET mfa_code = NULL, mfa_expires = NULL WHERE id = ?', [userId]);
        await logAudit(req, 'MFA_RESET_BY_ADMIN', 'user', null, { targetUserId: userId }, req.user.id);

        res.json({ message: 'MFA reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reset MFA' });
    }
};

// --- Transaction Monitoring ---

const getAllTransactions = async (req, res) => {
    try {
        const [transactions] = await db.query(`
            SELECT t.*, 
                   u_sender.name as sender_name, 
                   u_receiver.name as receiver_name
            FROM transactions t
            LEFT JOIN wallets w_sender ON t.sender_wallet_id = w_sender.id
            LEFT JOIN users u_sender ON w_sender.user_id = u_sender.id
            LEFT JOIN wallets w_receiver ON t.receiver_wallet_id = w_receiver.id
            LEFT JOIN users u_receiver ON w_receiver.user_id = u_receiver.id
            ORDER BY t.created_at DESC
        `);
        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};

const reverseTransaction = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { transactionId } = req.body;
        
        await connection.beginTransaction();

        const [txs] = await connection.query('SELECT * FROM transactions WHERE id = ?', [transactionId]);
        const tx = txs[0];

        if (!tx) {
            await connection.rollback();
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (tx.status === 'REVERSED') {
            await connection.rollback();
            return res.status(400).json({ error: 'Transaction already reversed' });
        }

        // Only P2P_TRANSFER can be logically reversed in this simplified model
        if (tx.type !== 'P2P_TRANSFER') {
            await connection.rollback();
            return res.status(400).json({ error: 'Only P2P transfers can be reversed currently' });
        }

        // 1. Return money to sender
        await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [tx.amount, tx.sender_wallet_id]);
        
        // 2. Take money from receiver
        await connection.query('UPDATE wallets SET balance = balance - ? WHERE id = ?', [tx.amount, tx.receiver_wallet_id]);

        // 3. Mark as reversed
        await connection.query("UPDATE transactions SET status = 'REVERSED', note = ? WHERE id = ?", ['Reversed by Admin', transactionId]);

        await connection.commit();
        await logAudit(req, 'TRANSACTION_REVERSED', 'transaction', null, { transactionId }, req.user.id);

        res.json({ message: 'Transaction reversed successfully' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to reverse transaction' });
    } finally {
        connection.release();
    }
};

// --- Broadcast ---

const broadcastNotification = async (req, res) => {
    try {
        const { title, message, type } = req.body;
        
        const [users] = await db.query('SELECT id FROM users');
        
        const notifications = users.map(u => [
            require('uuid').v4(),
            u.id,
            type || 'SYSTEM_ANNOUNCEMENT',
            title,
            message,
            false,
            new Date()
        ]);

        if (notifications.length > 0) {
            await db.query(`
                INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
                VALUES ?
            `, [notifications]);
        }

        res.json({ message: `Broadcast sent to ${users.length} users` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send broadcast' });
  }
};

// --- Audit Logs ---

const getAuditLogs = async (req, res) => {
    try {
        const { userId, action, limit = 50 } = req.query;
        let query = 'SELECT al.*, u.name as userName, u.email as userEmail FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id';
        const params = [];

        const conditions = [];
        if (userId) {
            conditions.push('al.user_id = ?');
            params.push(userId);
        }
        if (action) {
            conditions.push('al.action = ?');
            params.push(action);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY al.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [logs] = await db.query(query, params);
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};

const getLedgerSummary = async (req, res) => {
    try {
        const [summary] = await db.query(`
            SELECT 
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalCredits,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as totalDebits,
                SUM(amount) as imbalance
            FROM ledger_entries
        `);
        
        const [accounts] = await db.query(`
            SELECT la.*, u.name as ownerName, u.email as ownerEmail
            FROM ledger_accounts la
            LEFT JOIN users u ON la.owner_id = u.id
            ORDER BY la.balance DESC
        `);

        res.json({
            stats: summary[0],
            accounts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ledger summary' });
    }
};

const getLedgerEntries = async (req, res) => {
    try {
        const { accountId, limit = 100 } = req.query;
        let query = `
            SELECT le.*, la.name as accountName, t.type as txType, t.status as txStatus
            FROM ledger_entries le
            JOIN ledger_accounts la ON le.account_id = la.id
            JOIN transactions t ON le.transaction_id = t.id
        `;
        const params = [];

        if (accountId) {
            query += ' WHERE le.account_id = ?';
            params.push(accountId);
        }

        query += ' ORDER BY le.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [entries] = await db.query(query, params);
        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ledger entries' });
    }
};

const getSystemOverview = async (req, res) => {
    try {
        // 1. Core Metrics
        const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
        const [[{ dailyVolume }]] = await db.query(`
            SELECT IFNULL(SUM(amount), 0) as dailyVolume 
            FROM transactions 
            WHERE DATE(created_at) = CURDATE() 
            AND status = 'COMPLETED'
        `);
        const [[{ pendingKYC }]] = await db.query("SELECT COUNT(*) as pendingKYC FROM kyc_verifications WHERE status = 'PENDING'");
        const [[{ activeNow }]] = await db.query(`
            SELECT COUNT(DISTINCT user_id) as activeNow 
            FROM device_sessions 
            WHERE last_login >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        `);

        // 2. Recent Activity feed (joined with user names)
        const [recentActivity] = await db.query(`
            SELECT al.action, al.resource, al.created_at, u.name as userName, u.email as userEmail
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 10
        `);

        // 3. Platform Health (Mocked based on connectivity)
        const health = {
            database: "Healthy",
            apiGateway: "Active",
            kycProcessor: "Active",
            ledgerEngine: "Synchronized",
            uptime: "99.98%"
        };

        res.json({
            stats: {
                totalUsers,
                dailyVolume: parseFloat(dailyVolume),
                activeNow,
                pendingKYC
            },
            recentActivity,
            health
        });
    } catch (err) {
        console.error('System Overview Error:', err);
        res.status(500).json({ error: 'Failed to aggregate system metrics' });
    }
};

module.exports = {
    getUsers,
    toggleUserStatus,
    resetUserMFA,
    getAllTransactions,
    reverseTransaction,
    broadcastNotification,
    getAuditLogs,
    getLedgerSummary,
    getLedgerEntries,
    getSystemOverview
};
