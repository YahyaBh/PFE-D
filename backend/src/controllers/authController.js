const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const { logAudit } = require('../lib/auditLogger');
const { validate } = require('../lib/validate');
const riskService = require('../services/riskService');
const emailService = require('../services/emailService');

const generateCode = (length = 6) => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Schema handled by migrations
const fixUserSchema = async () => {};
fixUserSchema();

const register = async (req, res) => {
  try {
    const { email, password, name, phone, faceDescriptor } = req.body;

    const check = validate({
        email: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        password: { required: true, type: 'string', minLength: 6 },
        name: { type: 'string', maxLength: 100 },
        phone: { type: 'string', pattern: /^\+?[\d\s-]{7,20}$/ }
    }, req.body);
    if (!check.valid) {
      return res.status(400).json({ error: check.errors.join('; ') });
    }

    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const emailCode = generateCode();
    const phoneCode = generateCode();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        'INSERT INTO users (id, email, password, name, phone, email_verification_code, phone_verification_code, verification_expires, face_descriptor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, email, hashedPassword, name, phone, emailCode, phoneCode, expiry, JSON.stringify(faceDescriptor)]
      );

      // SIMULATION: Log codes to console
      if (process.env.NODE_ENV !== 'production') {
        console.log('--- VERIFICATION CODES SENT ---');
        console.log(`Email (${email}): ${emailCode}`);
        console.log(`Phone (${phone}): ${phoneCode}`);
        console.log('-------------------------------');
      }

      // Create 6 wallet accounts: MAD, EUR, USD fiat + BTC, ETH, USDT crypto vaults
      const fiatCurrencies = ['MAD', 'EUR', 'USD'];
      const cryptoCurrencies = ['BTC', 'ETH', 'USDT'];

      for (const currency of fiatCurrencies) {
        const walletId = uuidv4();
        await connection.query(
          'INSERT INTO wallet_accounts (id, user_id, currency, balance, type, status, label) VALUES (?, ?, ?, 0, ?, ?, ?)',
          [walletId, userId, currency, 'fiat', 'active', `${currency} Wallet`]
        );
        await connection.query(
          'INSERT IGNORE INTO ledger_accounts (id, owner_id, name, type, balance, currency) VALUES (?, ?, ?, ?, 0, ?)',
          [walletId, userId, `${currency} Wallet - User ${userId}`, 'LIABILITY', currency]
        );
      }

      for (const currency of cryptoCurrencies) {
        const vaultId = uuidv4();
        await connection.query(
          'INSERT INTO wallet_accounts (id, user_id, currency, balance, type, status, label) VALUES (?, ?, ?, 0, ?, ?, ?)',
                      [vaultId, userId, currency, 'crypto', 'active', `${currency} Vault`]
        );
      }

      // Legacy: also create old wallets table entry for backward compat
      const legacyWalletId = uuidv4();
      await connection.query(
        'INSERT INTO wallets (id, user_id, balance, currency) VALUES (?, ?, 0, ?)',
        [legacyWalletId, userId, 'MAD']
      );

      await connection.commit();

      await logAudit(req, 'USER_REGISTERED', 'auth', null, { email, name }, userId);

      const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = uuidv4();
      const tokenHash = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.query(
        'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, device_info) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), userId, tokenHash, expiresAt, req.headers['user-agent'] || 'unknown']
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: { id: userId, email, name },
        accessToken,
        refreshToken,
        token: accessToken,
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const check = validate({
        email: { required: true, type: 'string' },
        password: { required: true, type: 'string' }
    }, req.body);
    if (!check.valid) {
      return res.status(400).json({ error: check.errors.join('; ') });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAudit(req, 'LOGIN_FAILED', 'auth', { email }, null, user.id);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate dynamic MFA code
    const mfaCode = generateCode();

    // Use MySQL NOW() and store the expiry
    try {
      const [updateResult] = await db.query(
        'UPDATE users SET mfa_code = ?, mfa_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
        [mfaCode, user.id]
      );
      
      if (updateResult.affectedRows === 0) {
        console.error('WARNING: MFA code update affected 0 rows for user:', user.id);
      }
    } catch (updateErr) {
      console.error('CRITICAL: Failed to update MFA code:', updateErr);
      return res.status(500).json({ error: 'Failed to generate MFA code. Please try again.' });
    }

    // SIMULATION
    await emailService.sendMFACode(user.email, mfaCode);

    res.json({ 
      message: 'Initial login successful', 
      requireMFA: true,
      email: user.email,
      userId: user.id,
      faceDescriptor: user.face_descriptor // Return for frontend comparison
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const verifyMFA = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: 'UserId and code are required' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check expiry
    const [expiryCheck] = await db.query(
      'SELECT NOW() > mfa_expires AS isExpired FROM users WHERE id = ?',
      [userId]
    );
    
    if (expiryCheck[0]?.isExpired) {
      return res.status(400).json({ error: 'MFA code expired' });
    }

    if (user.mfa_code && user.mfa_code.toUpperCase() === code.toUpperCase()) {
      // 1. Success — clear MFA
      await db.query('UPDATE users SET mfa_code = NULL, mfa_expires = NULL WHERE id = ?', [userId]);

      // 1.1 New Device Check
      const [sessions] = await db.query('SELECT id FROM device_sessions WHERE user_id = ? AND device = ?', [userId, req.headers['user-agent'] || 'unknown']);
      if (sessions.length === 0) {
        await riskService.logRiskEvent(userId, 'NEW_DEVICE_LOGIN', 20, { device: req.headers['user-agent'] });
      }

      // 2. Generate Dual Tokens (15m Access, 30d Refresh)
      const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = uuidv4();
      const tokenHash = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // 3. Store Refresh Token
      await db.query(
        'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, device_info) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), user.id, tokenHash, expiresAt, req.headers['user-agent'] || 'unknown']
      );

      await logAudit(req, 'LOGIN_SUCCESS', 'auth', null, null, userId);

      return res.json({ 
        accessToken,
        refreshToken,
        token: accessToken,
        role: user.role,
        message: 'MFA verified successfully'
      });
    }

    await logAudit(req, 'LOGIN_FAILED', 'auth', { userId, reason: 'Invalid MFA' }, null, userId);
    res.status(400).json({ error: 'Invalid MFA code' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during MFA verification' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const [tokens] = await db.query('SELECT * FROM refresh_tokens WHERE expires_at > NOW()');
    
    let validToken = null;
    for (const t of tokens) {
      if (await bcrypt.compare(refreshToken, t.token_hash)) {
        validToken = t;
        break;
      }
    }

    if (!validToken) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    // Rotate Tokens
    await db.query('DELETE FROM refresh_tokens WHERE id = ?', [validToken.id]);

    const newAccessToken = jwt.sign({ id: validToken.user_id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = uuidv4();
    const newTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await db.query(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, device_info) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), ?)',
      [uuidv4(), validToken.user_id, newTokenHash, req.headers['user-agent'] || 'unknown']
    );

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const [tokens] = await db.query('SELECT id, token_hash FROM refresh_tokens WHERE user_id = ?', [req.user.id]);
    
    for (const t of tokens) {
      if (await bcrypt.compare(refreshToken, t.token_hash)) {
        await db.query('DELETE FROM refresh_tokens WHERE id = ?', [t.id]);
        break;
      }
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

const logoutAll = async (req, res) => {
  try {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    res.status(500).json({ error: 'Logout all failed' });
  }
};

const verifyToken = async (req, res) => {
  try {
    const { userId, type, code } = req.body; // type: 'email' or 'phone'

    if (!userId || !type || !code) {
      return res.status(400).json({ error: 'UserId, type, and code are required' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check expiry
    if (new Date(user.verification_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    const fieldToCompare = type === 'email' ? 'email_verification_code' : 'phone_verification_code';
    const statusField = type === 'email' ? 'is_email_verified' : 'is_phone_verified';

    if (user[fieldToCompare].toUpperCase() === code.toUpperCase()) {
      await db.query(`UPDATE users SET ${statusField} = TRUE WHERE id = ?`, [userId]);
      
      // Check if BOTH are now verified for direct sign-in
      const [updatedUsers] = await db.query('SELECT is_email_verified, is_phone_verified FROM users WHERE id = ?', [userId]);
      const updatedUser = updatedUsers[0];

      let token = null;
      if (updatedUser.is_email_verified && updatedUser.is_phone_verified) {
          token = jwt.sign(
            { id: userId }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );
      }

      return res.json({ 
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} verified successfully`,
        isEmailVerified: !!updatedUser.is_email_verified,
        isPhoneVerified: !!updatedUser.is_phone_verified,
        token,
        directSignIn: !!token
      });
    }

    res.status(400).json({ error: `Invalid ${type} verification code` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

const getMe = async (req, res) => {
  try {
    // 1. Fetch User and Session data
    const [users] = await db.query(`
      SELECT u.id, u.email, u.name, u.phone, u.role, u.tier, u.loyalty_points, u.created_at, 
             u.is_email_verified, u.is_phone_verified,
             s.device, s.last_login
      FROM users u
      LEFT JOIN (
        SELECT user_id, device, last_login 
        FROM device_sessions 
        WHERE user_id = ? 
        ORDER BY last_login DESC 
        LIMIT 1
      ) s ON u.id = s.user_id
      WHERE u.id = ?
    `, [req.user.id, req.user.id]);

    const user = users[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Fetch all wallet_accounts for the user
    const [walletAccounts] = await db.query(
      'SELECT id, balance, currency, type, status, label FROM wallet_accounts WHERE user_id = ?',
      [req.user.id]
    );

    // Format responsive for frontend
    const response = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      tier: user.tier,
      loyaltyPoints: user.loyalty_points,
      isEmailVerified: !!user.is_email_verified,
      isPhoneVerified: !!user.is_phone_verified,
      twoFactorEnabled: !!user.two_factor_enabled,
      createdAt: user.created_at,
      wallets: walletAccounts.map(w => ({
        id: w.id,
        balance: parseFloat(w.balance),
        currency: w.currency,
        type: w.type,
        status: w.status,
        label: w.label,
      })),
      // For backward compatibility (primary MAD wallet)
      wallet: {
        id: walletAccounts.find(w => w.currency === 'MAD')?.id,
        balance: parseFloat(walletAccounts.find(w => w.currency === 'MAD')?.balance || 0),
        currency: 'MAD'
      },
      device: user.device || 'Unknown Device',
      lastLogin: user.last_login ? new Date(user.last_login).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Never'
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching user' });
  }
};

const getFaceDescriptor = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow users to access their own face descriptor
    if (req.user.id !== userId && req.user.role !== 'ROLE_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const [users] = await db.query('SELECT face_descriptor FROM users WHERE id = ?', [userId]);
    const user = users[0];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.face_descriptor) {
      return res.json({ faceDescriptor: null });
    }
    
    res.json({ 
      faceDescriptor: typeof user.face_descriptor === 'string' 
        ? JSON.parse(user.face_descriptor) 
        : user.face_descriptor 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching face descriptor' });
  }
};

const resendMFA = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate NEW dynamic MFA code
    const mfaCode = generateCode();

    // Update DB with NEW code and fresh expiry (1 hour)
    try {
      await db.query(
        'UPDATE users SET mfa_code = ?, mfa_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
        [mfaCode, userId]
      );
    } catch (updateErr) {
      console.error('Failed to update MFA code during resend:', updateErr);
      return res.status(500).json({ error: 'Failed to generate new MFA code' });
    }

    // SIMULATION: Log codes to console
    await emailService.sendMFACode(user.email, mfaCode);

    res.json({ message: 'A new MFA code has been sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during MFA resend' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ error: 'UserId and type (email/phone) are required' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const codeColumn = type === 'email' ? 'email_verification_code' : 'phone_verification_code';
    const newCode = generateCode();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `UPDATE users SET ${codeColumn} = ?, verification_expires = ? WHERE id = ?`,
      [newCode, expiry, userId]
    );

    if (type === 'email') {
      await emailService.sendGenericEmail({
        to: user.email,
        subject: 'Verify Your Email - Marjane Wallet',
        title: 'Email Verification Code',
        bodyHtml: `
          <p>Hello,</p>
          <p>Use the following code to verify your email address for Marjane Wallet. This code expires in 24 hours.</p>
          <div style="background-color: #1b263b; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 2.5rem; font-weight: bold; letter-spacing: 5px; color: #e0c56e;">${newCode}</span>
          </div>
        `
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`--- RESENT ${type.toUpperCase()} CODE ---`);
      console.log(`To: ${type === 'email' ? user.email : user.phone}`);
      console.log(`Code: ${newCode}`);
      console.log('-------------------------------');
    }

    res.json({ message: `A new verification code has been sent to your ${type}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during resend verification' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [users] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
    const user = users[0];

    // Always return success even if email not found (prevents email enumeration)
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const resetToken = uuidv4();
    const tokenHash = await bcrypt.hash(resetToken, 10);

    await db.query(
      'UPDATE users SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
      [tokenHash, user.id]
    );

    await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during password reset request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const [users] = await db.query(
      'SELECT id, reset_token, reset_expires FROM users WHERE reset_expires IS NOT NULL AND reset_expires > NOW()'
    );

    let targetUser = null;
    for (const u of users) {
      if (u.reset_token && await bcrypt.compare(token, u.reset_token)) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [hashedPassword, targetUser.id]
    );

    await logAudit(req, 'PASSWORD_RESET', 'auth', null, null, targetUser.id);

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during password reset' });
  }
};

module.exports = {
  register,
  login,
  verifyMFA,
  verifyToken,
  resendMFA,
  resendVerification,
  forgotPassword,
  resetPassword,
  logout,
  logoutAll,
  refreshToken,
  getMe,
  getFaceDescriptor
};
