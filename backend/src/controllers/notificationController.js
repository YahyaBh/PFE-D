const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Schema handled by migrations
async function fixNotificationSchema() {}

fixNotificationSchema().catch(console.error);

/**
 * SSE endpoint: streams unread notification count every 30 seconds
 */
const streamNotifications = async (req, res) => {
    // Auth is verified by middleware before this point
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });

    res.write('event: connected\ndata: {}\n\n');

    const userId = req.user.id;
    let lastUnreadCount = -1;

    const sendUnreadCount = async () => {
        try {
            const [rows] = await db.query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
                [userId]
            );
            const count = rows[0].count;
            if (count !== lastUnreadCount) {
                lastUnreadCount = count;
                res.write(`event: unread_count\ndata: ${JSON.stringify({ count })}\n\n`);
            }
        } catch (err) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
        }
    };

    // Send immediately, then every 30 seconds
    await sendUnreadCount();
    const interval = setInterval(sendUnreadCount, 30000);

    req.on('close', () => {
        clearInterval(interval);
    });
};

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
    deleteNotification,
    streamNotifications
};
