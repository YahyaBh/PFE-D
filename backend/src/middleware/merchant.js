const db = require('../lib/db');

/**
 * Merchant Middleware - Ensures the user is linked to an APPROVED merchant account
 */
module.exports = async (req, res, next) => {
    try {
        const [merchantUsers] = await db.query(
            `SELECT mu.merchant_id, mu.role, m.status AS merchant_status
             FROM merchant_users mu
             JOIN merchants m ON m.id = mu.merchant_id
             WHERE mu.user_id = ?`,
            [req.user.id]
        );

        if (merchantUsers.length === 0) {
            return res.status(403).json({ error: 'Access denied. Merchant account required.' });
        }

        const merchant = merchantUsers[0];

        if (merchant.merchant_status !== 'APPROVED') {
            const message = merchant.merchant_status === 'PENDING_APPROVAL'
                ? 'Merchant account is pending approval. Please wait for admin verification.'
                : 'Merchant account access denied. Contact support for details.';
            return res.status(403).json({ error: message });
        }

        // Attach approved merchant info to request
        req.merchant = { merchant_id: merchant.merchant_id, role: merchant.role };
        next();
    } catch (err) {
        console.error('Merchant Middleware Error:', err);
        res.status(500).json({ error: 'Internal server error checking merchant status' });
    }
};
