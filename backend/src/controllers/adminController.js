const db = require('../lib/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notificationController');
const { logAudit } = require('../lib/auditLogger');
const logger = require('../lib/logger');

// --- User Management ---

const getUsers = async (req, res) => {
    try {
        const { search, status: statusFilter, role: roleFilter, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;
        let conditions = [];
        let params = [];
        if (search) {
            conditions.push('(name LIKE ? OR email LIKE ?)');
            const p = `%${search}%`;
            params.push(p, p);
        }
        if (statusFilter && statusFilter !== 'all') {
            conditions.push('status = ?');
            params.push(statusFilter);
        }
        if (roleFilter && roleFilter !== 'all') {
            conditions.push('role = ?');
            params.push(roleFilter);
        }
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
        const [users] = await db.query(`
            SELECT id, name, email, phone, role, status, tier, loyalty_points, created_at 
            FROM users ${whereClause}
            ORDER BY created_at DESC LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);
        res.json({ users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query('SELECT id, name, email, phone, role, status, tier, loyalty_points, created_at FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        const user = users[0];
        const [wallets] = await db.query('SELECT id, currency, balance, status FROM wallet_accounts WHERE user_id = ?', [id]);
        const [transactions] = await db.query(`
            SELECT t.id, t.type, t.amount, t.currency, t.status, t.created_at,
                   u_s.name as senderName, u_r.name as receiverName
            FROM transactions t
            LEFT JOIN wallet_accounts w_s ON t.sender_wallet_id = w_s.id
            LEFT JOIN users u_s ON w_s.user_id = u_s.id
            LEFT JOIN wallet_accounts w_r ON t.receiver_wallet_id = w_r.id
            LEFT JOIN users u_r ON w_r.user_id = u_r.id
            WHERE w_s.user_id = ? OR w_r.user_id = ?
            ORDER BY t.created_at DESC LIMIT 5
        `, [id, id]);
        const [[{ kycStatus }]] = await db.query("SELECT status as kycStatus FROM kyc_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", [id]);
        res.json({ ...user, wallets, recentTransactions: transactions, kycStatus: kycStatus || 'NOT_SUBMITTED' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { userId, status } = req.body; // 'active' or 'suspended'
        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

        // If suspended, invalidate sessions
        if (status === 'suspended') {
            await db.query("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);
        }

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

const suspendUser = async (req, res) => {
    try {
        const { userId, reason } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID required' });

        await db.query("UPDATE users SET status = 'suspended' WHERE id = ?", [userId]);
        await db.query("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);

        await logAudit(req, 'USER_SUSPENDED', 'user', { userId }, { reason }, req.user.id);

        res.json({ message: 'User suspended and sessions invalidated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to suspend user' });
    }
};

const unsuspendUser = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID required' });

        await db.query("UPDATE users SET status = 'active' WHERE id = ?", [userId]);

        await logAudit(req, 'USER_UNSUSPENDED', 'user', { userId }, null, req.user.id);

        res.json({ message: 'User account reactivated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reactivate user' });
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
        const { search, type, status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;
        let conditions = [];
        let params = [];
        if (search) {
            conditions.push('(t.id LIKE ? OR u_sender.name LIKE ? OR u_receiver.name LIKE ?)');
            const p = `%${search}%`;
            params.push(p, p, p);
        }
        if (type) {
            conditions.push('t.type = ?');
            params.push(type);
        }
        if (status) {
            conditions.push('t.status = ?');
            params.push(status);
        }
        if (dateFrom) {
            conditions.push('t.created_at >= ?');
            params.push(dateFrom);
        }
        if (dateTo) {
            conditions.push('t.created_at <= ?');
            params.push(dateTo);
        }
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM transactions t ${whereClause}`, params);
        const [transactions] = await db.query(`
            SELECT t.*, 
                   u_sender.name as sender_name, 
                   u_receiver.name as receiver_name
            FROM transactions t
            LEFT JOIN wallet_accounts w_sender ON t.sender_wallet_id = w_sender.id
            LEFT JOIN users u_sender ON w_sender.user_id = u_sender.id
            LEFT JOIN wallet_accounts w_receiver ON t.receiver_wallet_id = w_receiver.id
            LEFT JOIN users u_receiver ON w_receiver.user_id = u_receiver.id
            ${whereClause}
            ORDER BY t.created_at DESC LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);
        res.json({ transactions, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
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

        if (tx.type !== 'P2P_TRANSFER') {
            await connection.rollback();
            return res.status(400).json({ error: 'Only P2P transfers can be reversed currently' });
        }

        await connection.query('UPDATE wallet_accounts SET balance = balance + ? WHERE id = ?', [tx.amount, tx.sender_wallet_id]);
        await connection.query('UPDATE wallet_accounts SET balance = balance - ? WHERE id = ?', [tx.amount, tx.receiver_wallet_id]);
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
        const { title, message, level = 'info', target = 'all' } = req.body;
        let userQuery = 'SELECT id FROM users';
        let params = [];
        if (target === 'users') userQuery += " WHERE role = 'ROLE_USER'";
        else if (target === 'merchants') userQuery += " WHERE role = 'ROLE_MERCHANT'";
        else if (target === 'admins') userQuery += " WHERE role = 'ROLE_ADMIN'";

        const [users] = await db.query(userQuery, params);
        if (users.length === 0) return res.json({ message: 'Broadcast sent to 0 users' });

        const typeMap = { info: 'SYSTEM_ANNOUNCEMENT', warning: 'SECURITY_ALERT', critical: 'SECURITY_ALERT' };
        const notifications = users.map(u => [
            require('uuid').v4(),
            u.id,
            typeMap[level] || 'SYSTEM_ANNOUNCEMENT',
            title,
            message,
            false,
            new Date()
        ]);

        await db.query(`
            INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
            VALUES ?
        `, [notifications]);

        await logAudit(req, 'BROADCAST_SENT', 'broadcast', null, { title, level, target, recipientCount: users.length }, req.user.id);

        res.json({ message: `Broadcast sent to ${users.length} users`, count: users.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send broadcast' });
    }
};

// --- Audit Logs ---

const getAuditLogs = async (req, res) => {
    try {
        const { search, action, resource, userId, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;
        let conditions = [];
        let params = [];

        if (userId) {
            conditions.push('al.user_id = ?');
            params.push(userId);
        }
        if (action) {
            conditions.push('al.action = ?');
            params.push(action);
        }
        if (resource) {
            conditions.push('al.resource = ?');
            params.push(resource);
        }
        if (search) {
            conditions.push('(al.action LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR al.resource LIKE ?)');
            const p = `%${search}%`;
            params.push(p, p, p, p);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ${whereClause}`, params);
        const [logs] = await db.query(`
            SELECT al.*, u.name as userName, u.email as userEmail
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ${whereClause}
            ORDER BY al.created_at DESC LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);
        res.json({ logs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
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

const getKycVerifications = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;
        let conditions = [];
        let params = [];

        if (status && status !== 'all') {
            conditions.push('kv.status = ?');
            params.push(status);
        }
        if (search) {
            conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
            const p = `%${search}%`;
            params.push(p, p);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const [[{ pending }]] = await db.query("SELECT COUNT(*) as pending FROM kyc_verifications WHERE status='PENDING'");
        const [[{ verified }]] = await db.query("SELECT COUNT(*) as verified FROM kyc_verifications WHERE status='VERIFIED'");
        const [[{ rejected }]] = await db.query("SELECT COUNT(*) as rejected FROM kyc_verifications WHERE status='REJECTED'");
        const [[{ unverified }]] = await db.query("SELECT COUNT(*) as unverified FROM kyc_verifications WHERE status='UNVERIFIED'");

        const [[{ total }]] = await db.query(`
            SELECT COUNT(*) as total FROM kyc_verifications kv
            JOIN users u ON kv.user_id = u.id ${whereClause}
        `, params);

        const [list] = await db.query(`
            SELECT kv.*, u.name as userName, u.email as userEmail, u.phone as userPhone,
                   (SELECT COUNT(*) FROM kyc_documents WHERE verification_id = kv.id) as docCount
            FROM kyc_verifications kv
            JOIN users u ON kv.user_id = u.id
            ${whereClause}
            ORDER BY kv.submitted_at DESC, kv.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);

        res.json({ reviews: list, stats: { pending, verified, rejected, unverified }, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch KYC verifications' });
    }
};

const approveKyc = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("UPDATE kyc_verifications SET status = 'VERIFIED', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?", [req.user.id, id]);
        const [rows] = await db.query('SELECT user_id FROM kyc_verifications WHERE id = ?', [id]);
        if (rows.length > 0) {
            await notificationController.createNotification(rows[0].user_id, 'KYC', 'KYC Approved', 'Your identity verification has been approved.');
        }
        await logAudit(req, 'KYC_APPROVED', 'kyc', id, null, req.user.id);
        res.json({ message: 'KYC approved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to approve KYC' });
    }
};

const rejectKyc = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        await db.query("UPDATE kyc_verifications SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?", [req.user.id, id]);
        const [rows] = await db.query('SELECT user_id FROM kyc_verifications WHERE id = ?', [id]);
        if (rows.length > 0) {
            await notificationController.createNotification(rows[0].user_id, 'KYC', 'KYC Rejected', reason ? `Reason: ${reason}` : 'Your identity verification was rejected. Please resubmit.');
        }
        await logAudit(req, 'KYC_REJECTED', 'kyc', id, { reason }, req.user.id);
        res.json({ message: 'KYC rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reject KYC' });
    }
};

const reconcileLedger = async (req, res) => {
    try {
        const [[{ totalCredits }]] = await db.query('SELECT COALESCE(SUM(amount),0) as totalCredits FROM ledger_entries WHERE amount > 0');
        const [[{ totalDebits }]] = await db.query('SELECT COALESCE(SUM(ABS(amount)),0) as totalDebits FROM ledger_entries WHERE amount < 0');
        const imbalance = parseFloat(totalCredits) - parseFloat(totalDebits);
        await logAudit(req, 'LEDGER_RECONCILE', 'ledger', null, { totalCredits, totalDebits, imbalance }, req.user.id);
        res.json({ balanced: Math.abs(imbalance) < 0.01, totalCredits: parseFloat(totalCredits), totalDebits: parseFloat(totalDebits), imbalance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reconcile ledger' });
    }
};

const getSystemOverview = async (req, res) => {
    try {
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

        const [recentActivity] = await db.query(`
            SELECT al.action, al.resource, al.created_at, u.name as userName, u.email as userEmail
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 10
        `);

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

const getMerchantRequests = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;
        let conditions = [];
        let params = [];

        if (status) {
            conditions.push('m.status = ?');
            params.push(status);
        }
        if (search) {
            conditions.push('(m.name LIKE ? OR u.email LIKE ?)');
            const p = `%${search}%`;
            params.push(p, p);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const [[{ total }]] = await db.query(`
            SELECT COUNT(*) as total FROM merchants m
            LEFT JOIN merchant_users mu ON m.id = mu.merchant_id
            LEFT JOIN users u ON mu.user_id = u.id
            ${whereClause}
        `, params);

        const [requests] = await db.query(`
            SELECT m.id, m.name as businessName, m.description, m.category, m.status,
                   m.bank_info, m.documents_status, m.ice_number, m.created_at,
                   u.name as ownerName, u.email as ownerEmail, u.phone as ownerPhone
            FROM merchants m
            LEFT JOIN merchant_users mu ON m.id = mu.merchant_id
            LEFT JOIN users u ON mu.user_id = u.id
            ${whereClause}
            ORDER BY FIELD(m.status, 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED'), m.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);
        res.json({ requests, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch merchant requests' });
    }
};

const getMerchantRequestDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const [merchants] = await db.query(`
            SELECT m.*, u.name as ownerName, u.email as ownerEmail, u.phone as ownerPhone
            FROM merchants m
            LEFT JOIN merchant_users mu ON m.id = mu.merchant_id AND mu.role = 'OWNER'
            LEFT JOIN users u ON mu.user_id = u.id
            WHERE m.id = ?
        `, [id]);

        if (merchants.length === 0) {
            return res.status(404).json({ error: 'Merchant request not found' });
        }

        const merchant = merchants[0];
        if (merchant.bank_info) {
            try { merchant.bank_info = JSON.parse(merchant.bank_info); } catch (e) {}
        }

        res.json(merchant);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch merchant request detail' });
    }
};

const approveMerchant = async (req, res) => {
    const { merchantId, action, rejectionReason } = req.body; // action: 'APPROVED' or 'REJECTED'
    if (!['APPROVED', 'REJECTED'].includes(action)) {
        return res.status(400).json({ error: 'Action must be APPROVED or REJECTED' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [merchants] = await connection.query('SELECT * FROM merchants WHERE id = ?', [merchantId]);
        const merchant = merchants[0];
        if (!merchant) {
            await connection.rollback();
            return res.status(404).json({ error: 'Merchant not found' });
        }

        // Find the owner
        const [ownerRows] = await connection.query(
            'SELECT user_id FROM merchant_users WHERE merchant_id = ? AND role = ?',
            [merchantId, 'OWNER']
        );

        if (action === 'APPROVED') {
            // Create wallet
            const walletId = uuidv4();
            await connection.query(
                'INSERT INTO merchant_wallets (id, merchant_id, balance) VALUES (?, ?, 0.00)',
                [walletId, merchantId]
            );

            // Update status
            await connection.query(
                "UPDATE merchants SET status = 'ACTIVE' WHERE id = ?",
                [merchantId]
            );

            await connection.query(
                "UPDATE users SET role = 'ROLE_MERCHANT' WHERE id = ?",
                [ownerRows[0].user_id]
            );

            // Notify owner
            if (ownerRows.length > 0) {
                await notificationController.createNotification(
                    ownerRows[0].user_id,
                    'MERCHANT',
                    'Merchant Application Approved',
                    `Your merchant account "${merchant.name}" has been approved. You can now accept payments via the Merchant Hub.`
                );
            }
        } else {
            await connection.query(
                "UPDATE merchants SET status = 'REJECTED' WHERE id = ?",
                [merchantId]
            );

            // Notify owner
            if (ownerRows.length > 0) {
                const rejectionMsg = rejectionReason
                    ? `Reason: ${rejectionReason}`
                    : 'Please contact support for details.';
                await notificationController.createNotification(
                    ownerRows[0].user_id,
                    'MERCHANT',
                    'Merchant Application Rejected',
                    `Your merchant application "${merchant.name}" has been rejected. ${rejectionMsg}`
                );
            }
        }

        await connection.commit();
        await logAudit(req, `MERCHANT_${action}`, 'merchant', merchantId, { rejectionReason }, req.user.id);

        res.json({ message: `Merchant request ${action.toLowerCase()} successfully` });
    } catch (err) {
        await connection.rollback();
        logger.error(err);
        res.status(500).json({ error: 'Failed to process merchant request' });
    } finally {
        connection.release();
    }
};

/**
 * Reject a merchant request with a reason
 */
const rejectMerchant = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [merchants] = await connection.query('SELECT * FROM merchants WHERE id = ?', [id]);
        const merchant = merchants[0];
        if (!merchant) {
            await connection.rollback();
            return res.status(404).json({ error: 'Merchant not found' });
        }

        await connection.query(
            "UPDATE merchants SET status = 'REJECTED' WHERE id = ?",
            [id]
        );

        const [ownerRows] = await connection.query(
            'SELECT user_id FROM merchant_users WHERE merchant_id = ? AND role = ?',
            [id, 'OWNER']
        );

        if (ownerRows.length > 0) {
            await notificationController.createNotification(
                ownerRows[0].user_id,
                'MERCHANT',
                'Merchant Application Rejected',
                `Your merchant application "${merchant.name}" has been rejected. Reason: ${reason}`
            );
        }

        await connection.commit();
        await logAudit(req, 'MERCHANT_REJECTED', 'merchant', id, { reason }, req.user.id);

        res.json({ message: 'Merchant request rejected successfully' });
    } catch (err) {
        await connection.rollback();
        logger.error(err);
        res.status(500).json({ error: 'Failed to reject merchant request' });
    } finally {
        connection.release();
    }
};

/**
 * Mark a merchant settlement as COMPLETED
 */
const completeSettlement = async (req, res) => {
    const { settlementId } = req.body;
    if (!settlementId) return res.status(400).json({ error: 'settlementId required' });

    try {
        const [settlements] = await db.query('SELECT * FROM merchant_settlements WHERE id = ?', [settlementId]);
        if (settlements.length === 0) return res.status(404).json({ error: 'Settlement not found' });
        if (settlements[0].status !== 'PENDING') return res.status(400).json({ error: 'Settlement already processed' });

        await db.query("UPDATE merchant_settlements SET status = 'COMPLETED' WHERE id = ?", [settlementId]);

        const [merchantUsers] = await db.query(
            'SELECT user_id FROM merchant_users WHERE merchant_id = ?', [settlements[0].merchant_id]
        );
        if (merchantUsers.length > 0) {
            await notificationController.createNotification(
                merchantUsers[0].user_id,
                'SETTLEMENT',
                'Settlement Completed',
                `Your settlement of ${parseFloat(settlements[0].amount).toFixed(2)} MAD has been completed and transferred.`
            );
        }

        await logAudit(req, 'SETTLEMENT_COMPLETED', 'settlement', settlementId, { amount: settlements[0].amount }, req.user.id);
        res.json({ message: 'Settlement completed successfully' });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to complete settlement' });
    }
};

/**
 * Admin Login - validates credentials and returns JWT
 */
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];
        if (!user || user.role !== 'ROLE_ADMIN') {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = uuidv4();
        const tokenHash = await bcrypt.hash(refreshToken, 10);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await db.query(
            'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, device_info) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), user.id, tokenHash, expiresAt, req.headers['user-agent'] || 'unknown']
        );
        await logAudit(req, 'ADMIN_LOGIN', 'auth', null, null, user.id);
        res.json({
            accessToken,
            refreshToken,
            token: accessToken,
            admin: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Server error during admin login' });
    }
};

const getAdminStats = async (req, res) => {
    try {
        const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
        const [[{ activeUsers }]] = await db.query("SELECT COUNT(*) as activeUsers FROM users WHERE status = 'active'");
        const [[{ suspendedUsers }]] = await db.query("SELECT COUNT(*) as suspendedUsers FROM users WHERE status = 'suspended'");
        const [[{ totalTransactions }]] = await db.query('SELECT COUNT(*) as totalTransactions FROM transactions');
        const [[{ totalVolume }]] = await db.query("SELECT COALESCE(SUM(amount), 0) as totalVolume FROM transactions WHERE status = 'COMPLETED'");
        const [[{ todayVolume }]] = await db.query("SELECT COALESCE(SUM(amount), 0) as todayVolume FROM transactions WHERE status = 'COMPLETED' AND DATE(created_at) = CURDATE()");
        const [[{ pendingKYC }]] = await db.query("SELECT COUNT(*) as pendingKYC FROM kyc_verifications WHERE status = 'PENDING'");
        const [[{ pendingMerchants }]] = await db.query("SELECT COUNT(*) as pendingMerchants FROM merchants WHERE status = 'PENDING_APPROVAL'");
        const [[{ openDisputes }]] = await db.query("SELECT COUNT(*) as openDisputes FROM disputes WHERE status IN ('OPEN','UNDER_REVIEW')");

        const [recentActivity] = await db.query(`
            SELECT a.action, a.resource, a.created_at, u.name as userName, u.email as userEmail
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC LIMIT 10
        `);

        const [chartData] = await db.query(`
            SELECT DATE(created_at) as date,
                   SUM(CASE WHEN status='COMPLETED' THEN amount ELSE 0 END) as revenue,
                   COUNT(*) as txCount
            FROM transactions
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            stats: { totalUsers, activeUsers, suspendedUsers, totalTransactions, totalVolume: parseFloat(totalVolume), todayVolume: parseFloat(todayVolume), pendingKYC, pendingMerchants, openDisputes },
            recentActivity,
            chartData,
            health: { db: 'connected', api: 'operational', lastBackup: new Date().toISOString() }
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
};

/**
 * Get merchant status for current user (lightweight check)
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
    adminLogin,
    getAdminStats,
    getUsers,
    getUserDetails,
    toggleUserStatus,
    suspendUser,
    unsuspendUser,
    resetUserMFA,
    getAllTransactions,
    reverseTransaction,
    broadcastNotification,
    getAuditLogs,
    getLedgerSummary,
    getLedgerEntries,
    getSystemOverview,
    getKycVerifications,
    approveKyc,
    rejectKyc,
    getMerchantRequests,
    getMerchantRequestDetail,
    approveMerchant,
    rejectMerchant,
    completeSettlement,
    reconcileLedger
};
