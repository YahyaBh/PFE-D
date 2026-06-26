const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes/api');
const exchangeService = require('./services/exchangeService');
const { validateConfig } = require('./lib/config');
const logger = require('./lib/logger');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production'
    : process.env.NODE_ENV === 'staging' ? '.env.staging'
    : '.env.development';
require('dotenv').config({ path: path.resolve(__dirname, '..', envFile) });

// Patch console to route through winston
console.log = (...args) => logger.info(args.join(' '));
console.error = (...args) => logger.error(args.join(' '));
console.warn = (...args) => logger.warn(args.join(' '));

const app = express();

// Validate environment configuration (fails fast in production)
const config = validateConfig();

const PORT = config.port;

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: config.isProduction
        ? config.corsOrigins
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Routes
app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`${err.message}`, { stack: err.stack, method: req.method, url: req.url });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: config.isProduction ? 'Internal server error' : err.message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
});

app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT} (${config.nodeEnv})`);
  try {
    await exchangeService.seedDefaultRates();
    logger.info('Exchange rates seeded');
  } catch (err) {
    logger.warn('Could not seed exchange rates (may already exist): ' + err.message);
  }
});

module.exports = app;
