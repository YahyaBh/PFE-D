const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notificationController');
const limitController = require('./limitController');
const ledgerService = require('../services/ledgerService');

const processDeposit = async (req, res) => {
    const { method, amount, currency, details } = req.body;
    const userId = req.user.id;

    if (!method || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid deposit details' });
    }

    // 0. SELF-HEALING DB LOGIC (Force fix constraints)
    try {
        await db.query(`
            SET @tableName = 'wallets';
            SET @indexName = 'userId';
            SET @dropStmt = IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tableName AND INDEX_NAME = @indexName) > 0,
                CONCAT('ALTER TABLE ', @tableName, ' DROP INDEX ', @indexName),
                'SELECT 1'
            );
            PREPARE stmt FROM @dropStmt;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        `).catch(e => console.log('DB Note: Skip drop index'));
        
        await db.query("ALTER TABLE wallets ADD UNIQUE KEY IF NOT EXISTS user_currency (user_id, currency)").catch(e => {});
    } catch (e) {
        console.log('Self-healing note:', e.message);
    }

    // 0.1 CARD VERIFICATION (NEW)
    if (method === 'card') {
        const { number, expiry, cvv } = details || {};
        if (!number || number.length < 13 || !expiry || !cvv) {
            return res.status(400).json({ error: 'Invalid card details provided' });
        }
        // Simulated verification logic
        if (cvv === '000') {
            return res.status(400).json({ error: 'Card verification failed: Invalid CVV' });
        }
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Get or Create wallet for the specific currency
        const [wallets] = await connection.query(
            'SELECT id, balance FROM wallets WHERE user_id = ? AND currency = ?',
            [userId, currency || 'MAD']
        );
        
        let wallet = wallets[0];

        if (!wallet) {
            // Create a new wallet for this currency if it doesn't exist
            const newWalletId = uuidv4();
            await connection.query(
                'INSERT INTO wallets (id, user_id, balance, currency) VALUES (?, ?, 0, ?)',
                [newWalletId, userId, currency || 'MAD']
            );
            wallet = { id: newWalletId, balance: 0 };
        }

        // 2. Determine processing time and status
        let status = 'COMPLETED';
        let processingMessage = '';
        let depositType = 'DEPOSIT';

        switch (method.toLowerCase()) {
            case 'crypto':
                depositType = 'DEPOSIT_CRYPTO';
                processingMessage = 'Crypto deposit confirmed instantly.';
                break;
            case 'card':
                depositType = 'DEPOSIT_CARD';
                processingMessage = 'Card payment processed successfully.';
                break;
            case 'bank':
                depositType = 'DEPOSIT_BANK';
                processingMessage = 'Bank transfer processed successfully.';
                break;
            default:
                processingMessage = 'Deposit processed successfully.';
        }

        // 3. Update balance immediately
        // 2.1 Check deposit limits
        try {
            await limitController.checkLimit(userId, 'deposit', amount);
        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ error: err.message });
        }

        await connection.query(
            'UPDATE wallets SET balance = balance + ? WHERE id = ?',
            [amount, wallet.id]
        );

        // 4. Record transaction with deposit method
        const transactionId = uuidv4();
        await connection.query(
            'INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status) VALUES (?, NULL, ?, ?, ?, ?, ?)',
            [transactionId, wallet.id, amount, currency || 'MAD', depositType, status]
        );

        // LEDGER: Credit User Wallet (+), Debit System Bank (-)
        await ledgerService.recordTransaction(connection, transactionId, [
            { accountId: wallet.id, amount: parseFloat(amount), description: `Deposit via ${method}` },
            { accountId: 'system-bank-account', amount: -parseFloat(amount), description: `External deposit into user wallet ${userId}` }
        ]);

        // 5. AWARD LOYALTY POINTS (for deposits > 300)
        let earnedPoints = 0;
        if (amount > 300) {
            earnedPoints = Math.floor(amount / 10);
            await connection.query(
                'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
                [earnedPoints, userId]
            );
        }

        await connection.commit();

        // 6. Trigger Notifications
        await notificationController.createNotification(
            userId,
            'PAYMENT',
            'Deposit Successful',
            `Successfully topped up ${amount} ${currency || 'MAD'} via ${method}.`
        );

        if (earnedPoints > 0) {
            await notificationController.createNotification(
                userId,
                'REWARD',
                'Points Earned!',
                `You earned ${earnedPoints} loyalty points from your deposit.`
            );
        }

        res.json({ 
            message: processingMessage || 'Deposit processed successfully', 
            transactionId,
            newBalance: parseFloat(wallet.balance) + parseFloat(amount),
            earnedPoints,
            status
        });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error during deposit processing' });
    } finally {
        connection.release();
    }
};

module.exports = {
    processDeposit
};
