const request = require('supertest');

// Mock dependencies before requiring app
jest.mock('../src/lib/db', () => {
  const mPool = {
    query: jest.fn().mockResolvedValue([[{ count: 0 }], []]),
    getConnection: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue([[], []]),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    }),
    on: jest.fn(),
  };
  return mPool;
});
jest.mock('../src/lib/auditLogger', () => ({ logAudit: jest.fn() }));
jest.mock('../src/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Set env vars
process.env.JWT_SECRET = 'test-jwt-secret-not-for-production';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-not-for-production';
process.env.DATABASE_URL = 'mysql://root@localhost:3306/marjane_wallet';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

describe('Health Check', () => {
  test('GET /api/health returns OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});
