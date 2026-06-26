const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');

// Schema handled by migrations
const fixLoyaltySchema = async () => {};
fixLoyaltySchema();

const getLoyaltyStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await db.query('SELECT loyalty_points, tier FROM users WHERE id = ?', [userId]);
        
        if (!users[0]) return res.status(404).json({ error: 'User not found' });

        const [coupons] = await db.query('SELECT * FROM coupons WHERE expiry_date > NOW()');
        const [userCoupons] = await db.query(`
            SELECT uc.*, c.code, c.discount_percentage 
            FROM user_coupons uc
            JOIN coupons c ON uc.coupon_id = c.id
            WHERE uc.user_id = ? AND uc.is_used = FALSE
        `, [userId]);

        res.json({
            points: users[0].loyalty_points,
            tier: users[0].tier,
            availableCoupons: coupons,
            myCoupons: userCoupons
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching loyalty status' });
    }
};

const claimCoupon = async (req, res) => {
    const { couponId } = req.body;
    const userId = req.user.id;

    try {
        const [coupons] = await db.query('SELECT * FROM coupons WHERE id = ?', [couponId]);
        const coupon = coupons[0];

        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

        const [users] = await db.query('SELECT loyalty_points FROM users WHERE id = ?', [userId]);
        const user = users[0];

        if (user.loyalty_points < coupon.points_cost) {
            return res.status(400).json({ error: 'Insufficient loyalty points' });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Deduct points
            await connection.query('UPDATE users SET loyalty_points = loyalty_points - ? WHERE id = ?', [coupon.points_cost, userId]);

            // Add user coupon
            const userCouponId = uuidv4();
            await connection.query(
                'INSERT INTO user_coupons (id, user_id, coupon_id, is_used) VALUES (?, ?, ?, FALSE)',
                [userCouponId, userId, couponId]
            );

            await connection.commit();
            res.json({ message: 'Coupon claimed successfully', userCouponId });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error claiming coupon' });
    }
};

module.exports = {
    getLoyaltyStatus,
    claimCoupon
};
