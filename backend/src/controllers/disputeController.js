const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const { logAudit } = require('../lib/auditLogger');
const ledgerService = require('../services/ledgerService');
const notificationController = require('./notificationController');

/**
 * Dispute Controller - Handle transaction reporting and resolution
 */
const createDispute = async (req, res) => {
    const { transactionId, reason, description } = req.body;
    const userId = req.user.id;

    if (!transactionId || !reason) {
        return res.status(400).json({ error: 'Transaction ID and reason are required' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Verify transaction exists and belongs to user
        const [transactions] = await connection.query(
            'SELECT * FROM transactions WHERE id = ? AND (sender_wallet_id IN (SELECT id FROM wallets WHERE user_id = ?) OR receiver_wallet_id IN (SELECT id FROM wallets WHERE user_id = ?))',
            [transactionId, userId, userId]
        );

        if (transactions.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Transaction not found or unauthorized' });
        }

        // 2. Check if already disputed
        const [existing] = await connection.query('SELECT id FROM disputes WHERE transaction_id = ?', [transactionId]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'This transaction is already being disputed' });
        }

        // 3. Create Dispute
        const disputeId = uuidv4();
        await connection.query(
            'INSERT INTO disputes (id, transaction_id, user_id, reason, description) VALUES (?, ?, ?, ?, ?)',
            [disputeId, transactionId, userId, reason, description]
        );

        await connection.commit();
        await logAudit(req, 'DISPUTE_CREATED', 'dispute', disputeId, { transactionId, reason });

        res.json({ message: 'Dispute submitted successfully', disputeId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error during dispute creation' });
    } finally {
        connection.release();
    }
};

const getMyDisputes = async (req, res) => {
    try {
        const [disputes] = await db.query(`
            SELECT d.*, t.amount, t.currency, t.type as txType
            FROM disputes d
            JOIN transactions t ON d.transaction_id = t.id
            WHERE d.user_id = ?
            ORDER BY d.created_at DESC
        `, [req.user.id]);
        res.json(disputes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch disputes' });
    }
};

const adminGetAllDisputes = async (req, res) => {
    try {
        const [disputes] = await db.query(`
            SELECT d.*, t.amount, t.currency, u.name as userName, u.email as userEmail
            FROM disputes d
            JOIN transactions t ON d.transaction_id = t.id
            JOIN users u ON d.user_id = u.id
            ORDER BY d.created_at DESC
        `);
        res.json(disputes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch disputes' });
    }
};

const resolveDispute = async (req, res) => {
    const { disputeId, status, resolutionNote } = req.body; // status: RESOLVED (Refunded), REJECTED

    if (!['RESOLVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid resolution status' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [disputes] = await connection.query('SELECT * FROM disputes WHERE id = ?', [disputeId]);
        const dispute = disputes[0];

        if (!dispute) {
            await connection.rollback();
            return res.status(404).json({ error: 'Dispute not found' });
        }

        if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
            await connection.rollback();
            return res.status(400).json({ error: 'Dispute already resolved' });
        }

        // 1. Update Dispute Status
        await connection.query(
            'UPDATE disputes SET status = ?, resolution_note = ?, updated_at = NOW() WHERE id = ?',
            [status, resolutionNote, disputeId]
        );

        // 2. Handle Refund if status is RESOLVED
        if (status === 'RESOLVED') {
            const [transactions] = await connection.query('SELECT * FROM transactions WHERE id = ?', [dispute.transaction_id]);
            const tx = transactions[0];

            if (tx && tx.status === 'COMPLETED') {
                // LEDGER REVERSAL Logic
                // If it was a P2P transfer: Debit Receiver (-), Credit Sender (+)
                if (tx.sender_wallet_id && tx.receiver_wallet_id) {
                    await connection.query('UPDATE wallets SET balance = balance - ? WHERE id = ?', [tx.amount, tx.receiver_wallet_id]);
                    await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [tx.amount, tx.sender_wallet_id]);

                    await ledgerService.recordTransaction(connection, tx.id, [
                        { accountId: tx.receiver_wallet_id, amount: -parseFloat(tx.amount), description: `Reversal (Refund) for Dispute ${disputeId}` },
                        { accountId: tx.sender_wallet_id, amount: parseFloat(tx.amount), description: `Refund Credit for Dispute ${disputeId}` }
                    ]);
                } 
                // If it was a Withdrawal: This is complex, usually manual, but let's debit system bank, credit user
                else if (tx.type === 'WITHDRAWAL') {
                    await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [tx.amount, tx.sender_wallet_id]);
                    await ledgerService.recordTransaction(connection, tx.id, [
                        { accountId: 'system-bank-account', amount: -parseFloat(tx.amount), description: `Withdrawal Reversal (Refund) for Dispute ${disputeId}` },
                        { accountId: tx.sender_wallet_id, amount: parseFloat(tx.amount), description: `Refund Credit for Dispute ${disputeId}` }
                    ]);
                }

                await connection.query('UPDATE transactions SET status = "REFUNDED" WHERE id = ?', [tx.id]);
            }
        }

        await connection.commit();
        await logAudit(req, `DISPUTE_${status}`, 'dispute', disputeId, { resolutionNote });

        // Notify User
        await notificationController.createNotification(
            dispute.user_id,
            'SYSTEM',
            `Dispute ${status}`,
            `Your dispute for transaction ${dispute.transaction_id.slice(0,8)} has been ${status.toLowerCase()}. ${resolutionNote || ""}`
        );

        res.json({ message: `Dispute ${status.toLowerCase()} successfully` });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error during dispute resolution' });
    } finally {
        connection.release();
    }
};

module.exports = {
    createDispute,
    getMyDisputes,
    adminGetAllDisputes,
    resolveDispute
};
