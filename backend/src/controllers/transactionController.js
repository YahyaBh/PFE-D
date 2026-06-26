const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notificationController');
const { logAudit } = require('../lib/auditLogger');
const ledgerService = require('../services/ledgerService');
const logger = require('../lib/logger');

// Schema handled by migrations
const fixTransactionSchema = async () => {};
fixTransactionSchema();

const searchUser = async (req, res) => {
    try {
        const { query } = req.query; // email or phone
        const userId = req.user.id;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const [users] = await db.query(
            'SELECT id, name, email, phone FROM users WHERE (email = ? OR phone = ?) AND id != ?',
            [query, query, userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during user search' });
    }
};



const getRecentTransactions = async (req, res) => {
    try {
        const userId = req.user.id;

        const [accounts] = await db.query('SELECT id FROM wallet_accounts WHERE user_id = ?', [userId]);
        const accountIds = accounts.map(a => a.id);

        if (accountIds.length === 0) {
            return res.json([]);
        }

        const placeholders = accountIds.map(() => '?').join(',');

        const [transactions] = await db.query(`
            SELECT t.id, t.sender_wallet_id, t.receiver_wallet_id, t.amount, t.currency, t.type, t.status, t.note, t.created_at,
                   su.name as senderName, su.email as senderEmail,
                   ru.name as receiverName, ru.email as receiverEmail
            FROM transactions t
            LEFT JOIN wallet_accounts sw ON t.sender_wallet_id = sw.id
            LEFT JOIN users su ON sw.user_id = su.id
            LEFT JOIN wallet_accounts rw ON t.receiver_wallet_id = rw.id
            LEFT JOIN users ru ON rw.user_id = ru.id
            WHERE t.sender_wallet_id IN (${placeholders}) OR t.receiver_wallet_id IN (${placeholders})
            ORDER BY t.created_at DESC
            LIMIT 20
        `, [...accountIds, ...accountIds]);

        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching transactions' });
    }
};

const requestMoney = async (req, res) => {
    const { recipientId, amount, note } = req.body;
    const requesterId = req.user.id; // The one who wants the money

    if (!recipientId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid request details' });
    }

    try {
        const [requesterWallets] = await db.query('SELECT id FROM wallet_accounts WHERE user_id = ? AND currency = ?', [requesterId, 'MAD']);
        const [recipientWallets] = await db.query('SELECT id FROM wallet_accounts WHERE user_id = ? AND currency = ?', [recipientId, 'MAD']);

        if (!requesterWallets[0] || !recipientWallets[0]) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const transactionId = uuidv4();
        // In a request: sender is the one who will pay (recipientId), receiver is the requester (requesterId)
        await db.query(
            'INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [transactionId, recipientWallets[0].id, requesterWallets[0].id, amount, 'MAD', 'REQUEST', 'PENDING', note || '']
        );

        res.json({ message: 'Request sent successfully', transactionId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during money request' });
    }
};

const getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const [wallets] = await db.query('SELECT id FROM wallet_accounts WHERE user_id = ? AND currency = ?', [userId, 'MAD']);
        const walletId = wallets[0]?.id;

        if (!walletId) return res.json([]);

        // Requests sent TO the user (where they are the potential sender)
        const [requests] = await db.query(`
            SELECT t.*, su.name as requesterName, su.email as requesterEmail
            FROM transactions t
            LEFT JOIN wallet_accounts rw ON t.receiver_wallet_id = rw.id
            LEFT JOIN users su ON rw.user_id = su.id
            WHERE t.sender_wallet_id = ? AND t.type = 'REQUEST' AND t.status = 'PENDING'
            ORDER BY t.created_at DESC
        `, [walletId]);

        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching requests' });
    }
};

const processRequest = async (req, res) => {
    const { requestId, action } = req.body; // action: 'APPROVE' or 'REJECT'
    const userId = req.user.id;

    try {
        const [transactions] = await db.query('SELECT * FROM transactions WHERE id = ? AND type = "REQUEST" AND status = "PENDING"', [requestId]);
        const transaction = transactions[0];

        if (!transaction) return res.status(404).json({ error: 'Request not found or already processed' });

        const [userWallets] = await db.query('SELECT id FROM wallet_accounts WHERE user_id = ? AND currency = ?', [userId, 'MAD']);
        if (userWallets[0].id !== transaction.sender_wallet_id) {
            return res.status(403).json({ error: 'Unauthorized to process this request' });
        }

        if (action === 'REJECT') {
            await db.query('UPDATE transactions SET status = "FAILED" WHERE id = ?', [requestId]);
            return res.json({ message: 'Request rejected' });
        }

        // APPROVE: Perform the transfer
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [senderWallet] = await connection.query('SELECT balance FROM wallet_accounts WHERE id = ?', [transaction.sender_wallet_id]);
            if (parseFloat(senderWallet[0].balance) < parseFloat(transaction.amount)) {
                throw new Error('Insufficient balance to approve request');
            }

            await connection.query('UPDATE wallet_accounts SET balance = balance - ? WHERE id = ?', [transaction.amount, transaction.sender_wallet_id]);
            await connection.query('UPDATE wallet_accounts SET balance = balance + ? WHERE id = ?', [transaction.amount, transaction.receiver_wallet_id]);
            
            // 4. Update status and Ledger
            await connection.query('UPDATE transactions SET status = "COMPLETED" WHERE id = ?', [requestId]);

            // LEDGER: Debit Requester (Sender in the TX object), Credit Approver? 
            // Wait, in a request: sender is the one WHO PAYS (approver), receiver is the one WHO ASKS.
            await ledgerService.recordTransaction(connection, requestId, [
                { accountId: transaction.sender_wallet_id, amount: -parseFloat(transaction.amount), description: `Paid request ${requestId}` },
                { accountId: transaction.receiver_wallet_id, amount: parseFloat(transaction.amount), description: `Received request payment ${requestId}` }
            ]);

            // Loyalty Points for the payer
            const pointsEarned = Math.floor(parseFloat(transaction.amount) / 100);
            if (pointsEarned > 0) {
                await connection.query('UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?', [pointsEarned, userId]);
            }

            await connection.commit();

            // 5. Trigger Notifications
            // Notify the requester that their request was paid
            const [receiverWallets] = await connection.query('SELECT user_id FROM wallet_accounts WHERE id = ?', [transaction.receiver_wallet_id]);
            if (receiverWallets[0]) {
                await notificationController.createNotification(
                    receiverWallets[0].user_id,
                    'PAYMENT',
                    'Request Paid',
                    `Your request for ${transaction.amount} MAD has been paid.`
                );
            }

            res.json({ message: 'Request approved and funds transferred' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            if (connection) connection.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Server error processing request' });
    }
};

const processQRPayment = async (req, res) => {
    const { receiverId, merchantId, amount, description } = req.body;
    const senderId = req.user.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid QR payment details' });
    }

    if (!receiverId && !merchantId) {
        return res.status(400).json({ error: 'Either receiverId or merchantId is required' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [senderWallets] = await connection.query('SELECT id, balance FROM wallet_accounts WHERE user_id = ? AND currency = ? FOR UPDATE', [senderId, 'MAD']);
        const senderWallet = senderWallets[0];

        if (!senderWallet || parseFloat(senderWallet.balance) < parseFloat(amount)) {
            throw new Error('Insufficient balance');
        }

        let receiverWallet;
        let receiverUserId;

        if (merchantId) {
            const [merchantWallets] = await connection.query(
                'SELECT id, merchant_id FROM merchant_wallets WHERE merchant_id = ?',
                [merchantId]
            );
            if (merchantWallets.length === 0) throw new Error('Merchant wallet not found');

            receiverWallet = merchantWallets[0];

            const [ownerRows] = await connection.query(
                'SELECT user_id FROM merchant_users WHERE merchant_id = ? AND role = ?',
                [merchantId, 'OWNER']
            );
            receiverUserId = ownerRows.length > 0 ? ownerRows[0].user_id : null;
        } else {
            const [receiverWallets] = await connection.query('SELECT id FROM wallet_accounts WHERE user_id = ? AND currency = ?', [receiverId, 'MAD']);
            receiverWallet = receiverWallets[0];
            if (!receiverWallet) throw new Error('Receiver wallet not found');
            receiverUserId = receiverId;
        }

        await connection.query('UPDATE wallet_accounts SET balance = balance - ? WHERE id = ?', [amount, senderWallet.id]);
        await connection.query('UPDATE wallet_accounts SET balance = balance + ? WHERE id = ?', [amount, receiverWallet.id]);

        const transactionId = uuidv4();
        const note = description || 'Payment via QR Scan';
        await connection.query(
            'INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [transactionId, senderWallet.id, receiverWallet.id, amount, 'MAD', 'QR_PAYMENT', 'COMPLETED', note]
        );

        await ledgerService.recordTransaction(connection, transactionId, [
            { accountId: senderWallet.id, amount: -parseFloat(amount), description: 'QR Payment Out' },
            { accountId: receiverWallet.id, amount: parseFloat(amount), description: 'QR Payment In' }
        ]);

        await connection.commit();

        await notificationController.createNotification(
            senderId,
            'PAYMENT',
            'QR Payment Successful',
            `You paid ${amount} MAD via QR Scan.`
        );

        if (receiverUserId) {
            await notificationController.createNotification(
                receiverUserId,
                'PAYMENT',
                'QR Payment Received',
                `You received ${amount} MAD via QR Scan.`
            );
        }

        await logAudit(req, 'QR_PAYMENT', 'wallet', null, { receiverId, merchantId, amount, transactionId });

        res.json({ message: 'QR Payment successful', transactionId, merchantId: merchantId || null });
    } catch (err) {
        await connection.rollback();
        logger.error(err);
        res.status(500).json({ error: err.message || 'Server error during QR payment' });
    } finally {
        connection.release();
    }
};

/**
 * Full transaction history with filters, search, pagination, sorting
 * GET /api/transactions/history
 * Query params: page, limit, type, status, dateFrom, dateTo, minAmount, maxAmount, search, sortBy, sortOrder
 */
const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            page = 1, limit = 20,
            type, status,
            dateFrom, dateTo,
            minAmount, maxAmount,
            search,
            sortBy = 'created_at', sortOrder = 'DESC'
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        // Get ALL wallet IDs for this user (multi-currency)
        const [wallets] = await db.query('SELECT id FROM wallet_accounts WHERE user_id = ?', [userId]);
        if (wallets.length === 0) return res.json({ transactions: [], total: 0, page: pageNum, totalPages: 0 });

        const walletIds = wallets.map(w => w.id);
        const walletPlaceholders = walletIds.map(() => '?').join(',');

        let conditions = [`(t.sender_wallet_id IN (${walletPlaceholders}) OR t.receiver_wallet_id IN (${walletPlaceholders}))`];
        let params = [...walletIds, ...walletIds];

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
            params.push(dateTo + ' 23:59:59');
        }
        if (minAmount) {
            conditions.push('t.amount >= ?');
            params.push(parseFloat(minAmount));
        }
        if (maxAmount) {
            conditions.push('t.amount <= ?');
            params.push(parseFloat(maxAmount));
        }
        if (search) {
            conditions.push('(su.name LIKE ? OR su.email LIKE ? OR ru.name LIKE ? OR ru.email LIKE ?)');
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const whereClause = conditions.join(' AND ');

        // Validate sort params to prevent injection
        const allowedSortBy = ['created_at', 'amount', 'type', 'status'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
        const safeSortOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Count total
        const [countResult] = await db.query(`
            SELECT COUNT(*) as total
            FROM transactions t
            LEFT JOIN wallet_accounts sw ON t.sender_wallet_id = sw.id
            LEFT JOIN users su ON sw.user_id = su.id
            LEFT JOIN wallet_accounts rw ON t.receiver_wallet_id = rw.id
            LEFT JOIN users ru ON rw.user_id = ru.id
            WHERE ${whereClause}
        `, params);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limitNum);

        // Fetch paginated results
        const [transactions] = await db.query(`
            SELECT t.id, t.sender_wallet_id, t.receiver_wallet_id, t.amount, t.currency, t.type, t.status, t.note, t.created_at,
                   su.name as senderName, su.email as senderEmail,
                   ru.name as receiverName, ru.email as receiverEmail
            FROM transactions t
            LEFT JOIN wallet_accounts sw ON t.sender_wallet_id = sw.id
            LEFT JOIN users su ON sw.user_id = su.id
            LEFT JOIN wallet_accounts rw ON t.receiver_wallet_id = rw.id
            LEFT JOIN users ru ON rw.user_id = ru.id
            WHERE ${whereClause}
            ORDER BY t.${safeSortBy} ${safeSortOrder}
            LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);

        // Mark direction for frontend
        const enriched = transactions.map(t => ({
            ...t,
            direction: walletIds.includes(t.sender_wallet_id) ? 'OUT' : 'IN'
        }));

        res.json({ transactions: enriched, total, page: pageNum, totalPages });
    } catch (err) {
        console.error('Transaction history error:', err);
        res.status(500).json({ error: 'Server error fetching transaction history' });
    }
};

module.exports = {
    searchUser,
    getRecentTransactions,
    requestMoney,
    getPendingRequests,
    processRequest,
    processQRPayment,
    getTransactionHistory
};
