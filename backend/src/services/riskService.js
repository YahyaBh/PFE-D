const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');

const riskService = {
    async logRiskEvent(userId, eventType, score, details = {}) {
        try {
            await db.query(
                'INSERT INTO risk_events (id, user_id, event_type, risk_score, details) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), userId, eventType, score, JSON.stringify(details)]
            );
        } catch (err) {
            console.error('Failed to log risk event:', err);
        }
    },

    /**
     * Velocity Check: Too many transactions in a short time.
     */
    async checkVelocity(userId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM transactions WHERE (sender_wallet_id IN (SELECT id FROM wallet_accounts WHERE user_id = ?) OR receiver_wallet_id IN (SELECT id FROM wallet_accounts WHERE user_id = ?)) AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
            [userId, userId]
        );

        const count = rows[0].count;
        if (count > 10) { // arbitrary threshold for demo
            await this.logRiskEvent(userId, 'HIGH_VELOCITY', 40, { txCountLastHour: count });
            return false; // Indicating high risk
        }
        return true;
    },

    /**
     * Large Amount Check
     */
    async checkAmount(userId, amount) {
        if (amount > 10000) {
            await this.logRiskEvent(userId, 'LARGE_TRANSACTION_ANOMALY', 30, { amount });
        }
    }
};

module.exports = riskService;
