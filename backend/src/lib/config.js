const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

function validateConfig() {
    const missing = REQUIRED_VARS.filter(v => !process.env[v]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (process.env.NODE_ENV === 'production') {
        if (process.env.JWT_SECRET.includes('change-this') || process.env.JWT_SECRET === 'production') {
            throw new Error(
                'FATAL: JWT_SECRET must be a strong random value in production. ' +
                'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
            );
        }
        if (!process.env.CORS_ORIGINS) {
            throw new Error('FATAL: CORS_ORIGINS must be configured in production');
        }
    }

    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('mysql://')) {
        throw new Error('DATABASE_URL must start with mysql://');
    }

    return {
        port: parseInt(process.env.PORT || '5000', 10),
        databaseUrl: process.env.DATABASE_URL,
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
        nodeEnv: process.env.NODE_ENV || 'development',
        corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()),
        isProduction: process.env.NODE_ENV === 'production',
    };
}

module.exports = { validateConfig };
