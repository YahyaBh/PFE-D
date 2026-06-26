const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const { logAudit } = require('../lib/auditLogger');
const ledgerService = require('../services/ledgerService');
const notificationController = require('./notificationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const evidenceDir = path.join(__dirname, '../../uploads/dispute_evidence');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

const evidenceStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, evidenceDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.params.id}_${Date.now()}${ext}`);
    }
});

const uploadEvidence = multer({
    storage: evidenceStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp', '.mp4', '.mov'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only JPG, PNG, PDF, WEBP, MP4, MOV files are allowed'));
    }
});

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
            'SELECT * FROM transactions WHERE id = ? AND (sender_wallet_id IN (SELECT id FROM wallet_accounts WHERE user_id = ?) OR receiver_wallet_id IN (SELECT id FROM wallet_accounts WHERE user_id = ?))',
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
            'INSERT INTO disputes (id, transaction_id, user_id, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)',
            [disputeId, transactionId, userId, reason, description, 'OPEN']
        );

        await connection.commit();
        await logAudit(req, 'DISPUTE_CREATED', 'dispute', disputeId, { transactionId, reason });

        // Notify user
        await notificationController.createNotification(
            userId, 'SYSTEM', 'Dispute Opened',
            `Your dispute for transaction ${transactionId.slice(0,8)} has been created and is under review.`
        );

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
        const { status, page = 1, limit = 20, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let where = 'WHERE 1=1';
        const params = [];
        if (status && status !== 'ALL') {
            where += ' AND d.status = ?';
            params.push(status);
        }
        if (search) {
            where += ' AND (u.name LIKE ? OR u.email LIKE ? OR d.reason LIKE ?)';
            const q = `%${search}%`;
            params.push(q, q, q);
        }

        const [countRows] = await db.query(`SELECT COUNT(*) as total FROM disputes d JOIN users u ON d.user_id = u.id ${where}`, params);
        const total = countRows[0].total;

        const [disputes] = await db.query(`
            SELECT d.*, t.amount, t.currency, u.name as userName, u.email as userEmail
            FROM disputes d
            JOIN transactions t ON d.transaction_id = t.id
            JOIN users u ON d.user_id = u.id
            ${where}
            ORDER BY d.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        res.json({ disputes, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        console.error(err);
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
                    await connection.query('UPDATE wallet_accounts SET balance = balance - ? WHERE id = ?', [tx.amount, tx.receiver_wallet_id]);
                    await connection.query('UPDATE wallet_accounts SET balance = balance + ? WHERE id = ?', [tx.amount, tx.sender_wallet_id]);

                    await ledgerService.recordTransaction(connection, tx.id, [
                        { accountId: tx.receiver_wallet_id, amount: -parseFloat(tx.amount), description: `Reversal (Refund) for Dispute ${disputeId}` },
                        { accountId: tx.sender_wallet_id, amount: parseFloat(tx.amount), description: `Refund Credit for Dispute ${disputeId}` }
                    ]);
                } 
                // If it was a Withdrawal: debit system bank, credit user
                else if (tx.type === 'WITHDRAWAL') {
                    await connection.query('UPDATE wallet_accounts SET balance = balance + ? WHERE id = ?', [tx.amount, tx.sender_wallet_id]);
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

const addMessage = async (req, res) => {
    try {
        const { disputeId, message } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ROLE_ADMIN';

        const [disputes] = await db.query('SELECT user_id, status FROM disputes WHERE id = ?', [disputeId]);
        const dispute = disputes[0];
        if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

        if (!isAdmin && dispute.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const msgId = uuidv4();
        await db.query(
            'INSERT INTO dispute_messages (id, dispute_id, sender_id, message, is_admin_reply) VALUES (?, ?, ?, ?, ?)',
            [msgId, disputeId, userId, message, isAdmin ? 1 : 0]
        );

        // Notify the other party
        if (isAdmin) {
            await notificationController.createNotification(
                dispute.user_id, 'SYSTEM', 'New Message on Dispute',
                `An admin replied to your dispute.`
            );
        } else {
            // Notify admins (simplified: notify first admin)
            const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
            if (admins.length > 0) {
                await notificationController.createNotification(
                    admins[0].id, 'SYSTEM', 'New Dispute Message',
                    `User sent a new message on dispute ${disputeId.slice(0,8)}.`
                );
            }
        }

        res.json({ message: 'Message sent', messageId: msgId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ROLE_ADMIN';

        const [disputes] = await db.query('SELECT user_id FROM disputes WHERE id = ?', [id]);
        const dispute = disputes[0];
        if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
        if (!isAdmin && dispute.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

        const [messages] = await db.query(`
            SELECT dm.*, u.name as senderName
            FROM dispute_messages dm
            LEFT JOIN users u ON dm.sender_id = u.id
            WHERE dm.dispute_id = ?
            ORDER BY dm.created_at ASC
        `, [id]);

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

// ── Evidence ──

const uploadEvidenceHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ROLE_ADMIN';

        const [disputes] = await db.query('SELECT user_id FROM disputes WHERE id = ?', [id]);
        const dispute = disputes[0];
        if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
        if (!isAdmin && dispute.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const evidenceId = uuidv4();
        await db.query(
            'INSERT INTO dispute_evidence (id, dispute_id, file_path, file_type) VALUES (?, ?, ?, ?)',
            [evidenceId, id, req.file.path, path.extname(req.file.originalname).toLowerCase().replace('.', '')]
        );

        res.json({ message: 'Evidence uploaded', evidenceId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload evidence' });
    }
};

const getEvidenceList = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ROLE_ADMIN';

        const [disputes] = await db.query('SELECT user_id FROM disputes WHERE id = ?', [id]);
        const dispute = disputes[0];
        if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
        if (!isAdmin && dispute.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

        const [evidence] = await db.query(
            'SELECT id, file_type, created_at FROM dispute_evidence WHERE dispute_id = ? ORDER BY created_at DESC',
            [id]
        );

        res.json(evidence);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch evidence' });
    }
};

const getEvidenceFile = async (req, res) => {
    try {
        const { id, evidenceId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ROLE_ADMIN';

        const [disputes] = await db.query('SELECT user_id FROM disputes WHERE id = ?', [id]);
        const dispute = disputes[0];
        if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
        if (!isAdmin && dispute.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

        const [evidence] = await db.query('SELECT * FROM dispute_evidence WHERE id = ? AND dispute_id = ?', [evidenceId, id]);
        const ev = evidence[0];
        if (!ev) return res.status(404).json({ error: 'Evidence not found' });
        if (!fs.existsSync(ev.file_path)) return res.status(404).json({ error: 'File not found on disk' });

        const ext = path.extname(ev.file_path).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.webp': 'image/webp', '.pdf': 'application/pdf',
            '.mp4': 'video/mp4', '.mov': 'video/quicktime',
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.sendFile(ev.file_path);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve evidence file' });
    }
};

module.exports = {
    createDispute,
    getMyDisputes,
    adminGetAllDisputes,
    resolveDispute,
    addMessage,
    getMessages,
    uploadEvidence,
    uploadEvidenceHandler,
    getEvidenceList,
    getEvidenceFile
};
