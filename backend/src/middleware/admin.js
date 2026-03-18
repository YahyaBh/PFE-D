/**
 * Admin Middleware
 * Verifies if the authenticated user has administrative privileges.
 */
const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'ROLE_ADMIN') {
        return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }

    next();
};

module.exports = admin;
