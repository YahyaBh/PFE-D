const db = require('./db');
const { v4: uuidv4 } = require('uuid');

/**
 * Zentral Audit Logger Utility
 * Captures sensitive system events for traceability.
 */
const logAudit = async (req, action, resource, oldValue = null, newValue = null, userId = null) => {
    try {
        const id = uuidv4();
        const targetUserId = userId || req.user?.id || null;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const device = req.headers['user-agent'] || 'Unknown Device';

        await db.query(`
            INSERT INTO audit_logs (
                id, user_id, action, resource, 
                old_value, new_value, ip_address, device_info
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, 
            targetUserId, 
            action, 
            resource, 
            JSON.stringify(oldValue), 
            JSON.stringify(newValue), 
            ip, 
            device
        ]);

        console.log(`[AUDIT] ${action} logged for user ${targetUserId}`);
    } catch (err) {
        console.error('FAILED TO LOG AUDIT:', err);
    }
};

module.exports = { logAudit };
