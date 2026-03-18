const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Self-healing DB check for notifications table - Aligned with Production Schema
 */
async function fixNotificationSchema() {
    const conn = await db.getConnection();
    try {
        await conn.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                type VARCHAR(50) NOT NULL, -- 'PAYMENT', 'REQUEST', 'SECURITY', 'REWARD'
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_read (user_id, is_read)
            )
        `);
    } finally {
        conn.release();
    }
}

// Run schema fix on load
fixNotificationSchema().catch(console.error);

const getNotifications = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Internal helper to create a notification
 */
const createNotification = async (userId, type, title, message) => {
    try {
        const id = uuidv4();
        await db.query(
            'INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
            [id, userId, type, title, message]
        );
        return id;
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

const deleteNotification = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification
};
