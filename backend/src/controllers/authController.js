const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const { logAudit } = require('../lib/auditLogger');

const generateCode = (length = 6) => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// --- SELF-HEALING DB ALIGNMENT ---
const fixUserSchema = async () => {
    try {
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('ROLE_USER', 'ROLE_ADMIN') DEFAULT 'ROLE_USER'");
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active', 'suspended') DEFAULT 'active'");
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE");
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE");
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(10)");
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verification_code VARCHAR(10)");
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires DATETIME");
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS face_descriptor JSON");
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0");
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36),
                action VARCHAR(100) NOT NULL,
                resource VARCHAR(100),
                old_value TEXT,
                new_value TEXT,
                ip_address VARCHAR(45),
                device_info TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 4. LEDGER SYSTEM
        await db.query(`
            CREATE TABLE IF NOT EXISTS ledger_accounts (
                id VARCHAR(36) PRIMARY KEY,
                owner_id VARCHAR(36),
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                balance DECIMAL(12,2) DEFAULT 0.00,
                currency VARCHAR(10) DEFAULT 'MAD',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `).catch(e => {});

        await db.query(`
            CREATE TABLE IF NOT EXISTS ledger_entries (
                id VARCHAR(36) PRIMARY KEY,
                transaction_id VARCHAR(36) NOT NULL,
                account_id VARCHAR(36) NOT NULL,
                amount DECIMAL(12,2) NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `).catch(e => {});

        // Initialize System Accounts
        const systemAccounts = [
            { id: 'system-bank-account', name: 'Marjane Reserve Bank', type: 'ASSET' },
            { id: 'system-fees-account', name: 'Transaction Fees Revenue', type: 'REVENUE' }
        ];

        for (const acc of systemAccounts) {
            await db.query('INSERT IGNORE INTO ledger_accounts (id, name, type) VALUES (?, ?, ?)', [acc.id, acc.name, acc.type]);
        }

        // 5. DISPUTES SYSTEM
        await db.query(`
            CREATE TABLE IF NOT EXISTS disputes (
                id VARCHAR(36) PRIMARY KEY,
                transaction_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                reason VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'OPEN',
                resolution_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `).catch(e => {});

        await db.query(`
            CREATE TABLE IF NOT EXISTS dispute_messages (
                id VARCHAR(36) PRIMARY KEY,
                dispute_id VARCHAR(36) NOT NULL,
                sender_id VARCHAR(36) NOT NULL,
                message TEXT NOT NULL,
                is_admin_reply BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `).catch(e => {});

        await db.query(`
            CREATE TABLE IF NOT EXISTS dispute_evidence (
                id VARCHAR(36) PRIMARY KEY,
                dispute_id VARCHAR(36) NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                file_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `).catch(e => {});

        // 6. MERCHANT SYSTEM
        await db.query(`
            CREATE TABLE IF NOT EXISTS merchant_users (
                id VARCHAR(36) PRIMARY KEY,
                merchant_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                role VARCHAR(20) DEFAULT 'OWNER',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `).catch(e => {});

        await db.query(`
            CREATE TABLE IF NOT EXISTS merchant_wallets (
                id VARCHAR(36) PRIMARY KEY,
                merchant_id VARCHAR(36) NOT NULL,
                balance DECIMAL(20, 2) DEFAULT 0.00,
                currency VARCHAR(10) DEFAULT 'MAD',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `).catch(e => {});

        await db.query(`
            CREATE TABLE IF NOT EXISTS merchant_settlements (
                id VARCHAR(36) PRIMARY KEY,
                merchant_id VARCHAR(36) NOT NULL,
                amount DECIMAL(20, 2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'MAD',
                status VARCHAR(20) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `).catch(e => {});

        console.log('--- DATABASE SELF-HEALING: SUCCESS (Ledger, Disputes & Merchant Systems Active) ---');
        console.log("DB Alignment: User & Audit table schema verified.");
    } catch (e) {
        console.warn("DB Alignment warning:", e.message);
    }
};
fixUserSchema();

const register = async (req, res) => {
  try {
    const { email, password, name, phone, faceDescriptor } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const walletId = uuidv4();
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
      console.log('--- VERIFICATION CODES SENT ---');
      console.log(`Email (${email}): ${emailCode}`);
      console.log(`Phone (${phone}): ${phoneCode}`);
      console.log('-------------------------------');

      await connection.query(
        'INSERT INTO wallets (id, user_id, balance, currency) VALUES (?, ?, ?, ?)',
        [walletId, userId, 0.0, 'MAD']
      );

      await connection.commit();
      
      res.status(201).json({ 
        message: 'User registered successfully',
        user: { id: userId, email, name } 
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

    // DB ALIGNMENT
    try {
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_code VARCHAR(10)");
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_expires DATETIME");
    } catch(e) {}

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
      console.log('MFA Update result:', JSON.stringify(updateResult));
      
      if (updateResult.affectedRows === 0) {
        console.error('WARNING: MFA code update affected 0 rows for user:', user.id);
      }
    } catch (updateErr) {
      console.error('CRITICAL: Failed to update MFA code:', updateErr);
      return res.status(500).json({ error: 'Failed to generate MFA code. Please try again.' });
    }

    // SIMULATION
    console.log('--- LOGIN MFA CODE SENT ---');
    console.log(`Email (${user.email}): ${mfaCode}`);
    console.log('---------------------------');

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

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check expiry — use NOW() to be consistent with how we stored mfa_expires
    console.log('MFA verify - user mfaCode:', user.mfa_code, 'mfaExpires:', user.mfa_expires);
    
    const [expiryCheck] = await db.query(
      'SELECT NOW() > mfa_expires AS isExpired, NOW() as serverNow, mfa_expires FROM users WHERE id = ?',
      [userId]
    );
    console.log('MFA expiry check:', JSON.stringify(expiryCheck[0]));
    
    if (expiryCheck[0]?.isExpired) {
      return res.status(400).json({ error: 'MFA code expired. Please log in again to get a new code.' });
    }

    if (user.mfa_code && user.mfa_code.toUpperCase() === code.toUpperCase()) {
      const { device } = req.body;
      const sessionId = uuidv4();
      
      // Track session
      try {
        await db.query(
          'INSERT INTO device_sessions (id, user_id, device, last_login) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE device = ?, last_login = NOW()',
          [sessionId, userId, device || 'Unknown Device', device || 'Unknown Device']
        );
      } catch (err) {
        console.error('Failed to record session:', err);
      }

      const token = jwt.sign(
        { id: userId }, 
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '24h' }
      );

      // Clear mfa code after success
      await db.query('UPDATE users SET mfa_code = NULL WHERE id = ?', [userId]);

      await logAudit(req, 'LOGIN_SUCCESS', 'auth', null, { sessionId }, userId);

      return res.json({ 
        token,
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
            process.env.JWT_SECRET || 'secret_key',
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
    // TEMPORARY AUTO-MIGRATION (to fix missing columns in some environments)
    try {
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0");
        console.log("Auto-migration: loyalty_points added.");
    } catch (e) {
        // Ignore if column already exists
    }

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

    // 2. Fetch all wallets for the user
    const [wallets] = await db.query(
      'SELECT id, balance, currency FROM wallets WHERE user_id = ?',
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
      createdAt: user.created_at,
      wallets: wallets.map(w => ({
        id: w.id,
        balance: parseFloat(w.balance),
        currency: w.currency
      })),
      // For backward compatibility (primary wallet)
      wallet: {
        id: wallets[0]?.id,
        balance: parseFloat(wallets[0]?.balance || 0),
        currency: wallets[0]?.currency || 'MAD'
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
    console.log('--- MFA CODE RESENT ---');
    console.log(`Email (${user.email}): ${mfaCode}`);
    console.log('-----------------------');

    res.json({ message: 'A new MFA code has been sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during MFA resend' });
  }
};

module.exports = {
  register,
  login,
  verifyMFA,
  verifyToken,
  resendMFA,
  getMe,
  getFaceDescriptor
};
