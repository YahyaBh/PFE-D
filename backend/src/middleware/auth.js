const jwt = require('jsonwebtoken');
const db = require('../lib/db');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await db.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists. Please log in again.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Please contact support.' });
    }

    req.user = user;
    next();
  } catch (ex) {
    if (ex.name === 'JsonWebTokenError' || ex.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    }
    
    console.error('CRITICAL: Auth Middleware Database/Internal Error:', ex);
    res.status(500).json({ error: 'Internal security verification error.' });
  }
};

module.exports = authMiddleware;
