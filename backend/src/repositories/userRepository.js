const db = require('../lib/db');

const userRepository = {
    async findById(id, connection = db) {
        const [rows] = await connection.query(
            'SELECT id, name, email, phone, tier, loyalty_points FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    async updateLoyaltyPoints(userId, points, connection = db) {
        await connection.query(
            'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
            [points, userId]
        );
    }
};

module.exports = userRepository;
