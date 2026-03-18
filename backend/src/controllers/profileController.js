const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const notificationController = require('./notificationController');
const { logAudit } = require('../lib/auditLogger');

/**
 * Update user profile (name, phone)
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone } = req.body;

        if (!name && !phone) {
            return res.status(400).json({ error: 'At least one field (name or phone) is required' });
        }

        // Check phone uniqueness if changed
        if (phone) {
            const [existing] = await db.query(
                'SELECT id FROM users WHERE phone = ? AND id != ?',
                [phone, userId]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Phone number already in use by another account' });
            }
        }

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (phone) {
            updates.push('phone = ?');
            values.push(phone);
        }

        values.push(userId);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        // Trigger notification
        await notificationController.createNotification(
            userId,
            'SECURITY',
            'Profile Updated',
            'Your profile details have been updated successfully.'
        );

        await logAudit(req, 'PROFILE_UPDATED', 'user', null, { name, phone });

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Server error updating profile' });
    }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Verify current password
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        // Trigger notification
        await notificationController.createNotification(
            userId,
            'SECURITY',
            'Password Changed',
            'Your account password has been successfully changed. If this wasn\'t you, contact support immediately.'
        );

        await logAudit(req, 'PASSWORD_CHANGED', 'user', null, null);

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ error: 'Server error changing password' });
    }
};

/**
 * Get all active device sessions
 */
const getSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const [sessions] = await db.query(
            'SELECT id, device, last_login FROM device_sessions WHERE user_id = ? ORDER BY last_login DESC',
            [userId]
        );

        res.json(sessions.map(s => ({
            id: s.id,
            device: s.device || 'Unknown Device',
            lastLogin: s.last_login
        })));
    } catch (err) {
        console.error('Sessions fetch error:', err);
        res.status(500).json({ error: 'Server error fetching sessions' });
    }
};

/**
 * Logout from all devices (clear all sessions)
 */
const logoutAllDevices = async (req, res) => {
    try {
        const userId = req.user.id;
        const [result] = await db.query(
            'DELETE FROM device_sessions WHERE user_id = ?',
            [userId]
        );

        // Trigger notification
        await notificationController.createNotification(
            userId,
            'SECURITY',
            'All Sessions Terminated',
            `All ${result.affectedRows} device session(s) have been logged out for security.`
        );

        await logAudit(req, 'SESSIONS_TERMINATED', 'user', null, { sessionsRemoved: result.affectedRows });

        res.json({ 
            message: 'All device sessions have been terminated',
            sessionsRemoved: result.affectedRows 
        });
    } catch (err) {
        console.error('Logout all error:', err);
        res.status(500).json({ error: 'Server error during global logout' });
    }
};

/**
 * Get face authentication enrollment status
 */
const getFaceAuthStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await db.query(
            'SELECT face_descriptor FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const descriptor = users[0].face_descriptor;
        let hasFaceAuth = false;

        if (descriptor) {
            try {
                const parsed = typeof descriptor === 'string' ? JSON.parse(descriptor) : descriptor;
                hasFaceAuth = Array.isArray(parsed) && parsed.length > 0;
            } catch {
                hasFaceAuth = false;
            }
        }

        res.json({ hasFaceAuth });
    } catch (err) {
        console.error('Face auth status error:', err);
        res.status(500).json({ error: 'Server error fetching face auth status' });
    }
};

/**
 * Remove face authentication data
 */
const removeFaceAuth = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query(
            'UPDATE users SET face_descriptor = NULL WHERE id = ?',
            [userId]
        );

        // Trigger notification
        await notificationController.createNotification(
            userId,
            'SECURITY',
            'Face ID Removed',
            'Your biometric face authentication has been removed from your account.'
        );

        await logAudit(req, 'FACE_ID_REMOVED', 'user', null, null);

        res.json({ message: 'Face authentication removed successfully' });
    } catch (err) {
        console.error('Remove face auth error:', err);
        res.status(500).json({ error: 'Server error removing face authentication' });
    }
};

module.exports = {
    updateProfile,
    changePassword,
    getSessions,
    logoutAllDevices,
    getFaceAuthStatus,
    removeFaceAuth
};
