const path = require('path');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production'
    : process.env.NODE_ENV === 'staging' ? '.env.staging'
    : '.env.development';
require('dotenv').config({ path: path.resolve(__dirname, envFile) });

function getConnection() {
  const url = new URL(process.env.DATABASE_URL || 'mysql://root@localhost:3306/marjane_wallet');
  return {
    host: url.hostname,
    port: parseInt(url.port || '3306', 10),
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.replace(/^\//, '') || 'marjane_wallet',
  };
}

module.exports = {
  development: {
    client: 'mysql2',
    connection: getConnection(),
    migrations: {
      directory: path.resolve(__dirname, 'database', 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'database', 'seeds'),
    },
  },

  staging: {
    client: 'mysql2',
    connection: getConnection(),
    migrations: {
      directory: path.resolve(__dirname, 'database', 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'database', 'seeds'),
    },
  },

  production: {
    client: 'mysql2',
    connection: getConnection(),
    migrations: {
      directory: path.resolve(__dirname, 'database', 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'database', 'seeds'),
    },
  },
};
