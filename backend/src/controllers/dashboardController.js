const db = require('../lib/db');

/**
 * Get aggregated dashboard statistics for the current user
 */
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Total Balance and Currency Breakdown
        // We sum balances across all wallets. Note: In a real app we'd convert currencies,
        // but for now we'll return the raw list and the sum assuming 1:1 or MAD primary.
        const [wallets] = await db.query(
            'SELECT balance, currency FROM wallets WHERE user_id = ?',
            [userId]
        );
        
        const totalBalance = wallets.reduce((acc, w) => acc + parseFloat(w.balance), 0);

        // 2. Pending Balance (Incoming funds not yet completed)
        const [pendingRows] = await db.query(`
            SELECT SUM(t.amount) as pendingSum 
            FROM transactions t
            INNER JOIN wallets w ON t.receiver_wallet_id = w.id
            WHERE w.user_id = ? AND t.status = "PENDING"
        `, [userId]);
        const pendingBalance = parseFloat(pendingRows[0].pendingSum || 0);

        // 3. Monthly Spending (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const [spendingRows] = await db.query(`
            SELECT SUM(t.amount) as spendingSum 
            FROM transactions t
            INNER JOIN wallets w ON t.sender_wallet_id = w.id
            WHERE w.user_id = ? AND t.status = "COMPLETED" 
            AND t.created_at >= ?
        `, [userId, thirtyDaysAgo]);
        const monthlySpending = parseFloat(spendingRows[0].spendingSum || 0);

        // 4. Rewards Earned
        const [userRows] = await db.query('SELECT loyalty_points FROM users WHERE id = ?', [userId]);
        const rewardsEarned = userRows[0].loyalty_points || 0;

        // 5. Last Transaction
        const [lastTransRows] = await db.query(`
            SELECT t.* FROM transactions t
            LEFT JOIN wallets sw ON t.sender_wallet_id = sw.id
            LEFT JOIN wallets rw ON t.receiver_wallet_id = rw.id
            WHERE sw.user_id = ? OR rw.user_id = ?
            ORDER BY t.created_at DESC LIMIT 1
        `, [userId, userId]);

        res.json({
            totalBalance,
            pendingBalance,
            monthlySpending,
            rewardsEarned,
            lastTransaction: lastTransRows[0] || null,
            wallets
        });
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getDashboardStats
};
