const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');

async function ensureIdempotencyTable() {}

const idempotencyMiddleware = async (req, res, next) => {
    await ensureIdempotencyTable();
    const key = req.headers['idempotency-key'];
    if (!key) return next();

    const userId = req.user.id;

    try {
        // 1. Check for existing response
        const [existing] = await db.query(
            'SELECT response_status, response_body FROM idempotency_keys WHERE user_id = ? AND idempotency_key = ?',
            [userId, key]
        );

        if (existing.length > 0) {
            const { response_status, response_body } = existing[0];
            return res.status(response_status).json(JSON.parse(response_body));
        }

        // 2. Intercept res.json to store the response
        const originalJson = res.json;
        res.json = function(body) {
            // Only store successful or handled business errors (2xx or 4xx)
            // Don't store 500s or unexpected crashes
            if (res.statusCode < 500) {
                db.query(
                    'INSERT IGNORE INTO idempotency_keys (id, user_id, idempotency_key, response_status, response_body) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), userId, key, res.statusCode, JSON.stringify(body)]
                ).catch(err => console.error('Idempotency Storage Error:', err));
            }
            return originalJson.call(this, body);
        };

        next();
    } catch (err) {
        console.error('Idempotency Middleware Error:', err);
        next();
    }
};

module.exports = idempotencyMiddleware;
