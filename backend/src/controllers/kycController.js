const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const notificationController = require('./notificationController');

// ── Upload config ──
const uploadDir = path.join(__dirname, '../../uploads/kyc');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.user.id}_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only JPG, PNG, PDF, WEBP files are allowed'));
    }
});

// Schema handled by migrations
const fixKYCSchema = async () => {};
fixKYCSchema();

// ── Helpers ──
const getOrCreateVerification = async (userId) => {
    const [rows] = await db.query('SELECT * FROM kyc_verifications WHERE user_id = ?', [userId]);
    if (rows.length > 0) return rows[0];
    const id = uuidv4();
    await db.query('INSERT INTO kyc_verifications (id, user_id) VALUES (?, ?)', [id, userId]);
    const [created] = await db.query('SELECT * FROM kyc_verifications WHERE id = ?', [id]);
    return created[0];
};

const calculateRiskScore = async (verificationId) => {
    const [docs] = await db.query('SELECT type FROM kyc_documents WHERE verification_id = ?', [verificationId]);
    const types = docs.map(d => d.type);
    let score = 50; // base
    if (types.includes('GOVERNMENT_ID')) score += 20;
    if (types.includes('SELFIE')) score += 15;
    if (types.includes('ADDRESS_PROOF')) score += 15;
    return Math.min(100, score);
};

// ── 1. GET /api/kyc/status ──
const getStatus = async (req, res) => {
    try {
        const verification = await getOrCreateVerification(req.user.id);
        const [docs] = await db.query('SELECT id, type, file_name, status, created_at FROM kyc_documents WHERE verification_id = ?', [verification.id]);
        const [reviews] = await db.query('SELECT action, note, reviewed_by, created_at FROM kyc_reviews WHERE verification_id = ? ORDER BY created_at DESC', [verification.id]);
        
        res.json({
            status: verification.status,
            riskScore: verification.risk_score,
            rejectionReason: verification.rejection_reason,
            submittedAt: verification.submitted_at,
            reviewedAt: verification.reviewed_at,
            documents: docs,
            reviews
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get KYC status' });
    }
};

// ── 2. POST /api/kyc/upload ──
const uploadDocument = async (req, res) => {
    try {
        const { type } = req.body; // GOVERNMENT_ID, SELFIE, ADDRESS_PROOF
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        if (!['GOVERNMENT_ID', 'SELFIE', 'ADDRESS_PROOF'].includes(type)) {
            return res.status(400).json({ error: 'Invalid document type' });
        }

        const verification = await getOrCreateVerification(req.user.id);

        // Remove old document of same type if exists
        const [existing] = await db.query('SELECT * FROM kyc_documents WHERE verification_id = ? AND type = ?', [verification.id, type]);
        if (existing.length > 0) {
            // Delete old file from disk
            const oldPath = existing[0].file_path;
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            await db.query('DELETE FROM kyc_documents WHERE id = ?', [existing[0].id]);
        }

        const docId = uuidv4();
        await db.query(
            'INSERT INTO kyc_documents (id, verification_id, type, file_path, file_name) VALUES (?, ?, ?, ?, ?)',
            [docId, verification.id, type, req.file.path, req.file.originalname]
        );

        // Recalculate risk score
        const score = await calculateRiskScore(verification.id);
        await db.query('UPDATE kyc_verifications SET risk_score = ? WHERE id = ?', [score, verification.id]);

        res.json({ message: 'Document uploaded', documentId: docId, riskScore: score });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};

// ── 3. POST /api/kyc/submit ──
const submitVerification = async (req, res) => {
    try {
        const verification = await getOrCreateVerification(req.user.id);
        const [docs] = await db.query('SELECT type FROM kyc_documents WHERE verification_id = ?', [verification.id]);

        if (docs.length === 0) {
            return res.status(400).json({ error: 'Please upload at least one document before submitting' });
        }

        const score = await calculateRiskScore(verification.id);

        await db.query(
            'UPDATE kyc_verifications SET status = ?, submitted_at = NOW(), risk_score = ?, rejection_reason = NULL WHERE id = ?',
            ['PENDING', score, verification.id]
        );
        await db.query('UPDATE users SET kyc_status = ? WHERE id = ?', ['PENDING', req.user.id]);

        // Add review trail
        await db.query(
            'INSERT INTO kyc_reviews (id, verification_id, action, note) VALUES (?, ?, ?, ?)',
            [uuidv4(), verification.id, 'SUBMITTED', `User submitted KYC with ${docs.length} document(s). Risk score: ${score}`]
        );

        await notificationController.createNotification(
            req.user.id, 'SECURITY', 'KYC Submitted',
            'Your identity verification has been submitted for review.'
        );

        res.json({ message: 'Verification submitted successfully', riskScore: score });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit verification' });
    }
};

// ── 4. GET /api/kyc/documents ──
const getDocuments = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'ROLE_ADMIN';
        const targetUserId = isAdmin && req.query.userId ? req.query.userId : req.user.id;
        const verification = await getOrCreateVerification(targetUserId);
        const [docs] = await db.query(
            'SELECT id, type, file_name, status, created_at FROM kyc_documents WHERE verification_id = ? ORDER BY created_at DESC',
            [verification.id]
        );
        res.json(docs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get documents' });
    }
};

// ── 5. POST /api/kyc/review (Admin action) ──
const reviewVerification = async (req, res) => {
    try {
        const { userId, action, note, riskScoreOverride } = req.body;
        if (!['APPROVED', 'REJECTED', 'RESUBMIT_REQUESTED'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        const [verifications] = await db.query('SELECT * FROM kyc_verifications WHERE user_id = ?', [userId]);
        if (verifications.length === 0) return res.status(404).json({ error: 'Verification not found' });

        const verification = verifications[0];
        const newStatus = action === 'APPROVED' ? 'VERIFIED' : action === 'REJECTED' ? 'REJECTED' : 'UNVERIFIED';

        await db.query(
            'UPDATE kyc_verifications SET status = ?, reviewed_at = NOW(), reviewed_by = ?, rejection_reason = ?, risk_score = ? WHERE id = ?',
            [newStatus, 'ADMIN', action === 'REJECTED' ? (note || 'Documents did not pass review') : null, riskScoreOverride || verification.risk_score, verification.id]
        );
        await db.query('UPDATE users SET kyc_status = ? WHERE id = ?', [newStatus, userId]);

        // Update all document statuses
        if (action === 'APPROVED') {
            await db.query('UPDATE kyc_documents SET status = ? WHERE verification_id = ?', ['APPROVED', verification.id]);
        }

        // Review trail
        await db.query(
            'INSERT INTO kyc_reviews (id, verification_id, action, note, reviewed_by) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), verification.id, action, note || '', 'ADMIN']
        );

        await notificationController.createNotification(
            userId, 'SECURITY',
            action === 'APPROVED' ? 'KYC Approved ✅' : action === 'REJECTED' ? 'KYC Rejected ❌' : 'KYC Resubmission Required',
            action === 'APPROVED' ? 'Your identity has been verified successfully.' :
            action === 'REJECTED' ? `Your verification was rejected: ${note || 'Please contact support.'}` :
            'Please resubmit your documents for verification.'
        );

        res.json({ message: `Verification ${action.toLowerCase()} successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to review verification' });
    }
};

// ── 6. POST /api/kyc/auto-verify (Simulated instant verification for demo) ──
const autoVerify = async (req, res) => {
    try {
        const verification = await getOrCreateVerification(req.user.id);
        
        if (verification.status !== 'PENDING') {
            return res.status(400).json({ error: 'Verification must be in PENDING status' });
        }

        const score = await calculateRiskScore(verification.id);
        
        if (score >= 80) {
            await db.query(
                'UPDATE kyc_verifications SET status = ?, reviewed_at = NOW(), reviewed_by = ?, risk_score = ? WHERE id = ?',
                ['VERIFIED', 'AUTO_SYSTEM', score, verification.id]
            );
            await db.query('UPDATE users SET kyc_status = ? WHERE id = ?', ['VERIFIED', req.user.id]);
            await db.query('UPDATE kyc_documents SET status = ? WHERE verification_id = ?', ['APPROVED', verification.id]);

            await db.query(
                'INSERT INTO kyc_reviews (id, verification_id, action, note, reviewed_by) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), verification.id, 'APPROVED', `Auto-approved with risk score ${score}/100`, 'AUTO_SYSTEM']
            );

            await notificationController.createNotification(
                req.user.id, 'SECURITY', 'KYC Verified ✅',
                `Your identity has been automatically verified. Risk score: ${score}/100.`
            );

            return res.json({ message: 'Auto-verification successful', status: 'VERIFIED', riskScore: score });
        } else {
            return res.json({ message: 'Risk score too low for auto-approval. Manual review required.', riskScore: score });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Auto-verification failed' });
    }
};

// ── 7. DELETE /api/kyc/documents/:id ──
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const verification = await getOrCreateVerification(req.user.id);

        const [docs] = await db.query('SELECT * FROM kyc_documents WHERE id = ? AND verification_id = ?', [id, verification.id]);
        if (docs.length === 0) return res.status(404).json({ error: 'Document not found' });

        // Delete file from disk
        if (fs.existsSync(docs[0].file_path)) fs.unlinkSync(docs[0].file_path);
        await db.query('DELETE FROM kyc_documents WHERE id = ?', [id]);

        // Recalculate risk
        const score = await calculateRiskScore(verification.id);
        await db.query('UPDATE kyc_verifications SET risk_score = ? WHERE id = ?', [score, verification.id]);

        res.json({ message: 'Document deleted', riskScore: score });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};

// ── 8. GET /api/kyc/documents/:id/file ──
const getDocumentFile = async (req, res) => {
    try {
        const { id } = req.params;

        const [docs] = await db.query('SELECT * FROM kyc_documents WHERE id = ?', [id]);
        const doc = docs[0];
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        // Users can only view their own docs; admins can view any
        const isAdmin = req.user.role === 'ROLE_ADMIN';
        if (!isAdmin) {
            const [verifications] = await db.query('SELECT * FROM kyc_verifications WHERE id = ?', [doc.verification_id]);
            if (verifications.length === 0 || verifications[0].user_id !== req.user.id) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        if (!fs.existsSync(doc.file_path)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        const ext = path.extname(doc.file_path).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
        res.sendFile(doc.file_path);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve document' });
    }
};

// ── 9. POST /api/kyc/reset-status (Resubmit after rejection) ──
const resetStatus = async (req, res) => {
    try {
        const [verifications] = await db.query('SELECT * FROM kyc_verifications WHERE user_id = ?', [req.user.id]);
        const verification = verifications[0];
        if (!verification) return res.status(404).json({ error: 'No verification record found' });

        if (verification.status !== 'REJECTED') {
            return res.status(400).json({ error: 'Only rejected verifications can be reset for resubmission' });
        }

        // Clear rejection and set back to UNVERIFIED so user can re-upload
        await db.query(
            'UPDATE kyc_verifications SET status = ?, rejection_reason = NULL, submitted_at = NULL, reviewed_at = NULL, reviewed_by = NULL WHERE id = ?',
            ['UNVERIFIED', verification.id]
        );
        await db.query('UPDATE users SET kyc_status = ? WHERE id = ?', ['UNVERIFIED', req.user.id]);

        // Delete old documents so user can re-upload
        const [oldDocs] = await db.query('SELECT file_path FROM kyc_documents WHERE verification_id = ?', [verification.id]);
        for (const d of oldDocs) {
            if (fs.existsSync(d.file_path)) fs.unlinkSync(d.file_path);
        }
        await db.query('DELETE FROM kyc_documents WHERE verification_id = ?', [verification.id]);

        await db.query(
            'INSERT INTO kyc_reviews (id, verification_id, action, note) VALUES (?, ?, ?, ?)',
            [uuidv4(), verification.id, 'RESET', 'User reset KYC for resubmission after rejection']
        );

        res.json({ message: 'KYC status reset. You can now re-upload documents and resubmit.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reset KYC status' });
    }
};

module.exports = {
    upload,
    getStatus,
    uploadDocument,
    submitVerification,
    getDocuments,
    reviewVerification,
    autoVerify,
    deleteDocument,
    getDocumentFile,
    resetStatus
};
