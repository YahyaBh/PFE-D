const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notificationController');
const limitController = require('./limitController');
const { logAudit } = require('../lib/auditLogger');
const ledgerService = require('../services/ledgerService');

// 0. SELF-HEALING DB LOGIC (Add note column and fix ENUMs if needed)
const fixTransactionSchema = async () => {
    try {
        // Add note column if it doesn't exist
        await db.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note VARCHAR(255) AFTER currency`).catch(e => {});
        await db.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_wallet_id VARCHAR(36) AFTER id`).catch(e => {});
        await db.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receiver_wallet_id VARCHAR(36) AFTER sender_wallet_id`).catch(e => {});
        
        // Modify columns to be snake_case (this is a conceptual alignment for self-healing)
        await db.query(`ALTER TABLE transactions MODIFY COLUMN type VARCHAR(50) NOT NULL`).catch(e => {});
        await db.query(`ALTER TABLE transactions MODIFY COLUMN status VARCHAR(20) DEFAULT 'PENDING'`).catch(e => {});
    } catch (e) {
        console.log('Self-healing note (transactions):', e.message);
    }
};
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

const transferMoney = async (req, res) => {
    const { receiverId, amount, currency } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid transfer details' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Get sender wallet and check balance
        const [senderWallets] = await connection.query(
            'SELECT id, balance FROM wallets WHERE user_id = ?',
            [senderId]
        );
        const senderWallet = senderWallets[0];

        if (!senderWallet || parseFloat(senderWallet.balance) < parseFloat(amount)) {
            await connection.rollback();
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // 1.1 Check transaction limits
        try {
            await limitController.checkLimit(senderId, 'transfer', amount);
        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ error: err.message });
        }

        // 2. Get receiver wallet
        const [receiverWallets] = await connection.query(
            'SELECT id FROM wallets WHERE user_id = ?',
            [receiverId]
        );
        const receiverWallet = receiverWallets[0];

        if (!receiverWallet) {
            await connection.rollback();
            return res.status(404).json({ error: 'Receiver wallet not found' });
        }

        // 3. Perform transfer
        await connection.query(
            'UPDATE wallets SET balance = balance - ? WHERE id = ?',
            [amount, senderWallet.id]
        );

        await connection.query(
            'UPDATE wallets SET balance = balance + ? WHERE id = ?',
            [amount, receiverWallet.id]
        );

        // 4. Record transaction and Ledger Entries
        const transactionId = uuidv4();
        await connection.query(
            'INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [transactionId, senderWallet.id, receiverWallet.id, amount, currency || 'MAD', 'P2P_TRANSFER', 'COMPLETED']
        );

        // LEDGER: Debit Sender (-), Credit Receiver (+)
        await ledgerService.recordTransaction(connection, transactionId, [
            { accountId: senderWallet.id, amount: -parseFloat(amount), description: `Transfer to ${receiverId}` },
            { accountId: receiverWallet.id, amount: parseFloat(amount), description: `Transfer from ${senderId}` }
        ]);

        // EXTRA: Loyalty Points (1 point per 100 MAD)
        const pointsEarned = Math.floor(parseFloat(amount) / 100);
        if (pointsEarned > 0) {
            await connection.query('UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?', [pointsEarned, senderId]);
        }

        await connection.commit();

        // 5. Trigger Notifications
        await notificationController.createNotification(
            senderId, 
            'PAYMENT', 
            'Money Sent', 
            `You sent ${amount} ${currency || 'MAD'} to recipient.`
        );
        await notificationController.createNotification(
            receiverId, 
            'PAYMENT', 
            'Money Received', 
            `You received ${amount} ${currency || 'MAD'} from sender.`
        );

        await logAudit(req, 'WALLET_TRANSFER', 'wallet', null, { to: receiverId, amount, currency, transactionId });

        res.json({ message: 'Transfer successful', transactionId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error during transfer' });
    } finally {
        connection.release();
    }
};

const getRecentTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get wallet ID first
        const [wallets] = await db.query('SELECT id FROM wallets WHERE user_id = ?', [userId]);
        const walletId = wallets[0]?.id;

        if (!walletId) {
            return res.json([]);
        }

        const [transactions] = await db.query(`
            SELECT t.*, 
                   su.name as senderName, su.email as senderEmail,
                   ru.name as receiverName, ru.email as receiverEmail
            FROM transactions t
            LEFT JOIN wallets sw ON t.sender_wallet_id = sw.id
            LEFT JOIN users su ON sw.user_id = su.id
            LEFT JOIN wallets rw ON t.receiver_wallet_id = rw.id
            LEFT JOIN users ru ON rw.user_id = ru.id
            WHERE t.sender_wallet_id = ? OR t.receiver_wallet_id = ?
            ORDER BY t.created_at DESC
            LIMIT 20
        `, [walletId, walletId]);

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
        // Get requester and recipient wallet IDs
        const [requesterWallets] = await db.query('SELECT id FROM wallets WHERE user_id = ?', [requesterId]);
        const [recipientWallets] = await db.query('SELECT id FROM wallets WHERE user_id = ?', [recipientId]);

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
        const [wallets] = await db.query('SELECT id FROM wallets WHERE user_id = ?', [userId]);
        const walletId = wallets[0]?.id;

        if (!walletId) return res.json([]);

        // Requests sent TO the user (where they are the potential sender)
        const [requests] = await db.query(`
            SELECT t.*, su.name as requesterName, su.email as requesterEmail
            FROM transactions t
            LEFT JOIN wallets rw ON t.receiver_wallet_id = rw.id
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

        // Verify that the person approving is the sender in the request
        const [userWallets] = await db.query('SELECT id FROM wallets WHERE user_id = ?', [userId]);
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
            // Check balance
            const [wallets] = await connection.query('SELECT balance FROM wallets WHERE id = ?', [transaction.sender_wallet_id]);
            if (parseFloat(wallets[0].balance) < parseFloat(transaction.amount)) {
                throw new Error('Insufficient balance to approve request');
            }

            // Transfer
            await connection.query('UPDATE wallets SET balance = balance - ? WHERE id = ?', [transaction.amount, transaction.sender_wallet_id]);
            await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [transaction.amount, transaction.receiver_wallet_id]);
            
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
            // We need to find the user_id for transaction.receiver_wallet_id
            const [receiverWallets] = await connection.query('SELECT user_id FROM wallets WHERE id = ?', [transaction.receiver_wallet_id]);
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


const withdrawMoney = async (req, res) => {
    const { amount, method } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid withdrawal amount' });

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [wallets] = await connection.query('SELECT id, balance FROM wallets WHERE user_id = ?', [userId]);
        const wallet = wallets[0];

        if (!wallet || parseFloat(wallet.balance) < parseFloat(amount)) {
            throw new Error('Insufficient balance');
        }

        // 1.1 Check withdrawal limits
        try {
            await limitController.checkLimit(userId, 'withdrawal', amount);
        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ error: err.message });
        }

        await connection.query('UPDATE wallets SET balance = balance - ? WHERE id = ?', [amount, wallet.id]);

        const transactionId = uuidv4();
        await connection.query(
            'INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, note) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)',
            [transactionId, wallet.id, amount, 'MAD', 'WITHDRAWAL', 'COMPLETED', `Withdrawal via ${method}`]
        );

        // LEDGER: Debit User Wallet (-), Credit System Bank (+)
        await ledgerService.recordTransaction(connection, transactionId, [
            { accountId: wallet.id, amount: -parseFloat(amount), description: `Withdrawal via ${method}` },
            { accountId: 'system-bank-account', amount: parseFloat(amount), description: `Withdrawal payout for user ${userId}` }
        ]);

        await connection.commit();
        await logAudit(req, 'WITHDRAWAL', 'wallet', null, { amount, method, transactionId });

        res.json({ message: 'Withdrawal successful', transactionId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: err.message || 'Server error during withdrawal' });
    } finally {
        connection.release();
    }
};

const processQRPayment = async (req, res) => {
    const { receiverId, amount } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid QR payment details' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [senderWallets] = await connection.query('SELECT id, balance FROM wallets WHERE user_id = ?', [senderId]);
        const senderWallet = senderWallets[0];

        if (!senderWallet || parseFloat(senderWallet.balance) < parseFloat(amount)) {
            throw new Error('Insufficient balance');
        }

        const [receiverWallets] = await connection.query('SELECT id FROM wallets WHERE user_id = ?', [receiverId]);
        const receiverWallet = receiverWallets[0];

        if (!receiverWallet) throw new Error('Receiver wallet not found');

        await connection.query('UPDATE wallets SET balance = balance - ? WHERE id = ?', [amount, senderWallet.id]);
        await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [amount, receiverWallet.id]);

        const transactionId = uuidv4();
        await connection.query(
            'INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [transactionId, senderWallet.id, receiverWallet.id, amount, 'MAD', 'QR_PAYMENT', 'COMPLETED', 'Payment via QR Scan']
        );

        // LEDGER: Debit Sender (-), Credit Receiver (+)
        await ledgerService.recordTransaction(connection, transactionId, [
            { accountId: senderWallet.id, amount: -parseFloat(amount), description: 'QR Payment Out' },
            { accountId: receiverWallet.id, amount: parseFloat(amount), description: 'QR Payment In' }
        ]);

        await connection.commit();

        // 5. Trigger Notifications
        await notificationController.createNotification(
            senderId, 
            'PAYMENT', 
            'QR Payment Successful', 
            `You paid ${amount} MAD via QR Scan.`
        );

        await logAudit(req, 'QR_PAYMENT', 'wallet', null, { receiverId, amount, transactionId });

        res.json({ message: 'QR Payment successful', transactionId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
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
        const [wallets] = await db.query('SELECT id FROM wallets WHERE user_id = ?', [userId]);
        if (wallets.length === 0) return res.json({ transactions: [], total: 0, page: pageNum, totalPages: 0 });

        const walletIds = wallets.map(w => w.id);
        const walletPlaceholders = walletIds.map(() => '?').join(',');

        // Build WHERE clauses
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
            LEFT JOIN wallets sw ON t.sender_wallet_id = sw.id
            LEFT JOIN users su ON sw.user_id = su.id
            LEFT JOIN wallets rw ON t.receiver_wallet_id = rw.id
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
            LEFT JOIN wallets sw ON t.sender_wallet_id = sw.id
            LEFT JOIN users su ON sw.user_id = su.id
            LEFT JOIN wallets rw ON t.receiver_wallet_id = rw.id
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
    transferMoney,
    getRecentTransactions,
    requestMoney,
    getPendingRequests,
    processRequest,
    withdrawMoney,
    processQRPayment,
    getTransactionHistory
};
