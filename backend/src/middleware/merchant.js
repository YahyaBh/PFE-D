const db = require('../lib/db');

/**
 * Merchant Middleware - Ensures the user is linked to a merchant account
 */
module.exports = async (req, res, next) => {
    try {
        const [merchantUsers] = await db.query(
            'SELECT merchant_id, role FROM merchant_users WHERE user_id = ?',
            [req.user.id]
        );

        if (merchantUsers.length === 0) {
            return res.status(403).json({ error: 'Access denied. Merchant account required.' });
        }

        // Attach merchant info to request
        req.merchant = merchantUsers[0];
        next();
    } catch (err) {
        console.error('Merchant Middleware Error:', err);
        res.status(500).json({ error: 'Internal server error checking merchant status' });
    }
};
