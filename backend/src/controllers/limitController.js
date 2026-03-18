const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');

// ── Self-healing DB logic ──
const fixLimitSchema = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS wallet_limits (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL UNIQUE,
                daily_transfer_limit DECIMAL(12,2) DEFAULT 5000.00,
                monthly_transfer_limit DECIMAL(12,2) DEFAULT 50000.00,
                daily_withdrawal_limit DECIMAL(12,2) DEFAULT 10000.00,
                monthly_withdrawal_limit DECIMAL(12,2) DEFAULT 100000.00,
                daily_deposit_limit DECIMAL(12,2) DEFAULT 20000.00,
                monthly_deposit_limit DECIMAL(12,2) DEFAULT 200000.00,
                currency VARCHAR(10) DEFAULT 'MAD',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Auto-migration: wallet_limits table ready.');
    } catch (e) {
        console.log('Limit schema note:', e.message);
    }
};
fixLimitSchema();

// ── Helpers ──
const getOrCreateLimits = async (userId) => {
    const [rows] = await db.query('SELECT * FROM wallet_limits WHERE user_id = ?', [userId]);
    if (rows.length > 0) return rows[0];

    // Fetch user tier
    const [users] = await db.query('SELECT tier FROM users WHERE id = ?', [userId]);
    const tier = users[0]?.tier || 'FREE';

    // Different defaults based on Tier
    let defaults = {
        daily_transfer: 5000,
        monthly_transfer: 50000,
        daily_withdrawal: 10000,
        monthly_withdrawal: 100000,
        daily_deposit: 20000,
        monthly_deposit: 200000
    };

    if (tier === 'PREMIUM' || tier === 'ELITE') {
        defaults = {
            daily_transfer: 25000,
            monthly_transfer: 250000,
            daily_withdrawal: 50000,
            monthly_withdrawal: 500000,
            daily_deposit: 100000,
            monthly_deposit: 1000000
        };
    }

    const id = uuidv4();
    await db.query(`
        INSERT INTO wallet_limits (
            id, user_id, 
            daily_transfer_limit, monthly_transfer_limit,
            daily_withdrawal_limit, monthly_withdrawal_limit,
            daily_deposit_limit, monthly_deposit_limit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [
            id, userId, 
            defaults.daily_transfer, defaults.monthly_transfer,
            defaults.daily_withdrawal, defaults.monthly_withdrawal,
            defaults.daily_deposit, defaults.monthly_deposit
        ]
    );
    
    const [created] = await db.query('SELECT * FROM wallet_limits WHERE id = ?', [id]);
    return created[0];
};

const getUsage = async (userId, type, period = 'daily') => {
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
        WHERE (sender_wallet_id IN (SELECT id FROM wallets WHERE user_id = ?) 
               OR (sender_wallet_id IS NULL AND receiver_wallet_id IN (SELECT id FROM wallets WHERE user_id = ?)))
        ${typeFilter}
        ${dateFilter}
        AND status = 'COMPLETED'
    `, [userId, userId]);

    return parseFloat(rows[0].total) || 0;
};

// ── API: GET /api/limits ──
const getLimits = async (req, res) => {
    try {
        const userId = req.user.id;
        const limits = await getOrCreateLimits(userId);

        const usage = {
            transfer: {
                daily: await getUsage(userId, 'transfer', 'daily'),
                monthly: await getUsage(userId, 'transfer', 'monthly')
            },
            withdrawal: {
                daily: await getUsage(userId, 'withdrawal', 'daily'),
                monthly: await getUsage(userId, 'withdrawal', 'monthly')
            },
            deposit: {
                daily: await getUsage(userId, 'deposit', 'daily'),
                monthly: await getUsage(userId, 'deposit', 'monthly')
            }
        };

        res.json({ limits, usage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch limits and usage' });
    }
};

// ── Internal: Check Limit ──
const checkLimit = async (userId, type, amount) => {
    const limits = await getOrCreateLimits(userId);
    const dailyUsage = await getUsage(userId, type, 'daily');
    const monthlyUsage = await getUsage(userId, type, 'monthly');

    const amountNum = parseFloat(amount);
    
    if (type === 'transfer') {
        if (dailyUsage + amountNum > parseFloat(limits.daily_transfer_limit)) {
            throw new Error(`Daily transfer limit exceeded. Remaining: ${(parseFloat(limits.daily_transfer_limit) - dailyUsage).toFixed(2)} ${limits.currency}`);
        }
        if (monthlyUsage + amountNum > parseFloat(limits.monthly_transfer_limit)) {
            throw new Error(`Monthly transfer limit exceeded. Remaining: ${(parseFloat(limits.monthly_transfer_limit) - monthlyUsage).toFixed(2)} ${limits.currency}`);
        }
    } else if (type === 'withdrawal') {
        if (dailyUsage + amountNum > parseFloat(limits.daily_withdrawal_limit)) {
            throw new Error(`Daily withdrawal limit exceeded. Remaining: ${(parseFloat(limits.daily_withdrawal_limit) - dailyUsage).toFixed(2)} ${limits.currency}`);
        }
        if (monthlyUsage + amountNum > parseFloat(limits.monthly_withdrawal_limit)) {
            throw new Error(`Monthly withdrawal limit exceeded. Remaining: ${(parseFloat(limits.monthly_withdrawal_limit) - monthlyUsage).toFixed(2)} ${limits.currency}`);
        }
    } else if (type === 'deposit') {
        if (dailyUsage + amountNum > parseFloat(limits.daily_deposit_limit)) {
            throw new Error(`Daily deposit limit exceeded. Remaining: ${(parseFloat(limits.daily_deposit_limit) - dailyUsage).toFixed(2)} ${limits.currency}`);
        }
        if (monthlyUsage + amountNum > parseFloat(limits.monthly_deposit_limit)) {
            throw new Error(`Monthly deposit limit exceeded. Remaining: ${(parseFloat(limits.monthly_deposit_limit) - monthlyUsage).toFixed(2)} ${limits.currency}`);
        }
    }

    return true;
};

module.exports = {
    getLimits,
    checkLimit,
    getOrCreateLimits
};
