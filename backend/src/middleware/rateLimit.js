const rateLimit = require('express-rate-limit');

/**
 * General API Limiter: 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        error: 'Too many requests from this IP. Please try again after 15 minutes.',
        code: 'TOO_MANY_REQUESTS'
    }
});

/**
 * Sensitive Authentication Limiter: 10 attempts per 30 minutes
 */
const sensitiveLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        error: 'Security alert: Too many sensitive attempts. Please try again after 30 minutes.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});

module.exports = {
    apiLimiter,
    sensitiveLimiter
};
