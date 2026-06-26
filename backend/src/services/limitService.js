const db = require('../lib/db');

const limitService = {
    async getUsage(userId, type, period = 'daily') {
        let dateFilter = '';
        if (period === 'daily') {
            dateFilter = 'AND DATE(created_at) = CURDATE()';
        } else if (period === 'monthly') {
            dateFilter = 'AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
        }

        let typeFilter = '';
        if (type === 'transfer') {
            typeFilter = "AND type = 'P2P_TRANSFER'";
        } else if (type === 'withdrawal') {
            typeFilter = "AND type = 'WITHDRAWAL'";
        } else if (type === 'deposit') {
            typeFilter = "AND type LIKE 'DEPOSIT%'";
        }

        const [rows] = await db.query(`
            SELECT SUM(amount) as total 
            FROM transactions 
            WHERE (sender_wallet_id IN (SELECT id FROM wallet_accounts WHERE user_id = ?) 
                   OR (sender_wallet_id IS NULL AND receiver_wallet_id IN (SELECT id FROM wallet_accounts WHERE user_id = ?)))
            ${typeFilter}
            ${dateFilter}
            AND status = 'COMPLETED'
        `, [userId, userId]);

        return parseFloat(rows[0].total) || 0;
    },

    async checkLimit(userId, type, amount) {
        // 1. Fetch User Tier Limits
        const [users] = await db.query(`
            SELECT COALESCE(t.daily_limit, 5000) as daily_limit,
                   COALESCE(t.monthly_limit, 50000) as monthly_limit
            FROM users u
            LEFT JOIN tiers t ON u.tier_id = t.id
            WHERE u.id = ?
        `, [userId]);

        const tier = users[0];
        if (!tier) throw new Error('User tier not found');

        // 2. Get Usage
        const dailyUsage = await this.getUsage(userId, type, 'daily');
        const monthlyUsage = await this.getUsage(userId, type, 'monthly');

        const amountNum = parseFloat(amount);

        if (dailyUsage + amountNum > parseFloat(tier.daily_limit)) {
            throw new Error(`Daily limit exceeded for ${type}. Limit: ${tier.daily_limit} MAD`);
        }
        if (monthlyUsage + amountNum > parseFloat(tier.monthly_limit)) {
            throw new Error(`Monthly limit exceeded for ${type}. Limit: ${tier.monthly_limit} MAD`);
        }

        return true;
    }
};

module.exports = limitService;
