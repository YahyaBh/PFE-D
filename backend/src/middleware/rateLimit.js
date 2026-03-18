const rateLimit = {};

/**
 * Basic in-memory rate limiter per user
 * @param {string} keyPrefix Unique key for the action (e.g., 'transfer')
 * @param {number} limit Max attempts
 * @param {number} windowMs Time window in milliseconds
 */
const createRateLimiter = (keyPrefix, limit, windowMs) => {
    return (req, res, next) => {
        const userId = req.user.id;
        const key = `${keyPrefix}:${userId}`;
        const now = Date.now();

        if (!rateLimit[key]) {
            rateLimit[key] = {
                hits: 1,
                resetTime: now + windowMs
            };
            return next();
        }

        const data = rateLimit[key];

        if (now > data.resetTime) {
            data.hits = 1;
            data.resetTime = now + windowMs;
            return next();
        }

        data.hits++;

        if (data.hits > limit) {
            const retryAfter = Math.ceil((data.resetTime - now) / 1000 / 60);
            return res.status(429).json({ 
                error: `Rate control: Too many ${keyPrefix} attempts. Please try again in ${retryAfter} minutes.`,
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        next();
    };
};

// Default sensitive action limiter: 5 attempts per 15 mins
const sensitiveLimiter = createRateLimiter('sensitive_action', 5, 15 * 60 * 1000);

module.exports = {
    createRateLimiter,
    sensitiveLimiter
};
