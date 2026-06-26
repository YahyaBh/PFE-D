const db = require('../src/lib/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

function rng(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 19).replace('T', ' '); }

async function main() {
  const pw = await bcrypt.hash('marjane2026', 10);
  const adminPw = await bcrypt.hash('admin123', 10);

  const USERS = [
    { id: uuidv4(), email: 'demo@marjane.ma', name: 'Soufiane Demo', phone: '+212 600-000000', role: 'ROLE_USER', tier: 'tier-silver', status: 'active' },
    { id: uuidv4(), email: 'admin@marjane.ma', name: 'Admin Master', phone: '+212 600-000001', role: 'ROLE_ADMIN', tier: 'tier-platinum', status: 'active' },
    { id: uuidv4(), email: 'youssef@marjane.ma', name: 'Youssef El Amrani', phone: '+212 600-000002', role: 'ROLE_USER', tier: 'tier-gold', status: 'active' },
    { id: uuidv4(), email: 'fatima@marjane.ma', name: 'Fatima Zahra Bennani', phone: '+212 600-000003', role: 'ROLE_USER', tier: 'tier-silver', status: 'active' },
    { id: uuidv4(), email: 'karim@marjane.ma', name: 'Karim Idrissi', phone: '+212 600-000004', role: 'ROLE_MERCHANT', tier: 'tier-gold', status: 'active' },
    { id: uuidv4(), email: 'nadia@marjane.ma', name: 'Nadia Oufkir', phone: '+212 600-000005', role: 'ROLE_USER', tier: 'tier-basic', status: 'active' },
    { id: uuidv4(), email: 'hassan@marjane.ma', name: 'Hassan Benjelloun', phone: '+212 600-000006', role: 'ROLE_MERCHANT', tier: 'tier-platinum', status: 'active' },
    { id: uuidv4(), email: 'amina@marjane.ma', name: 'Amina Tazi', phone: '+212 600-000007', role: 'ROLE_USER', tier: 'tier-silver', status: 'suspended' },
    { id: uuidv4(), email: 'mehdi@marjane.ma', name: 'Mehdi Alaoui', phone: '+212 600-000008', role: 'ROLE_USER', tier: 'tier-basic', status: 'active' },
    { id: uuidv4(), email: 'sara@marjane.ma', name: 'Sara Lamrani', phone: '+212 600-000009', role: 'ROLE_MERCHANT', tier: 'tier-gold', status: 'active' },
  ];

  // Check if already seeded
  const [existing] = await db.query('SELECT COUNT(*) as c FROM users');
  if (existing[0].c > 2) {
    console.log('Seed data already exists — skipping.');
    process.exit(0);
  }

  try {
    // ── INSERT USERS ──
    for (const u of USERS) {
      const hash = u.role === 'ROLE_ADMIN' ? adminPw : pw;
      const age = (u.email === 'demo@marjane.ma' || u.role === 'ROLE_ADMIN') ? 60 : rng(5, 55);
      await db.query(
        'INSERT INTO users (id, email, password, name, phone, role, tier_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.email, hash, u.name, u.phone, u.role, u.tier, u.status, daysAgo(age)]
      );
    }

    // ── WALLETS for each non-admin user ──
    var walletIds = {};
    for (const u of USERS) {
      if (u.role === 'ROLE_ADMIN') continue;
      var w = {
        mad: uuidv4(), eur: uuidv4(), usd: uuidv4(),
        btc: uuidv4(), eth: uuidv4(), usdt: uuidv4(),
      };
      walletIds[u.id] = w;

      var balances = {
        mad: u.role === 'ROLE_MERCHANT' ? rng(5000, 50000) : rng(500, 20000),
        eur: rng(0, 5000),
        usd: rng(0, 5000),
        btc: rng(0.01, 2),
        eth: rng(0.1, 10),
        usdt: rng(0, 5000),
      };

      var currs = [
        { id: w.mad, cur: 'MAD', bal: balances.mad, type: 'fiat', status: 'active' },
        { id: w.eur, cur: 'EUR', bal: balances.eur, type: 'fiat', status: 'active' },
        { id: w.usd, cur: 'USD', bal: balances.usd, type: 'fiat', status: 'active' },
        { id: w.btc, cur: 'BTC', bal: balances.btc, type: 'crypto', status: 'pending_regulation' },
        { id: w.eth, cur: 'ETH', bal: balances.eth, type: 'crypto', status: 'pending_regulation' },
        { id: w.usdt, cur: 'USDT', bal: balances.usdt, type: 'crypto', status: 'pending_regulation' },
      ];

      for (var c of currs) {
        await db.query(
          'INSERT INTO wallet_accounts (id, user_id, balance, currency, type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [c.id, u.id, c.bal, c.cur, c.type, c.status, daysAgo(rng(5, 60))]
        );
      }
    }
    console.log('--- ' + USERS.length + ' users created with wallets ---');

    // ── MERCHANT REQUESTS (5) ──
    var merchants = USERS.filter(function(u) { return u.role === 'ROLE_MERCHANT'; });
    var merRequests = [
      { userId: merchants[0].id, businessName: 'TechMall Maroc', businessType: 'Retail Electronics', status: 'APPROVED', rc: 'RC12345', ice: 'ICE678901', taxId: 'IF987654', docs: 'passport,cin' },
      { userId: merchants[1].id, businessName: 'Atlas Handicrafts', businessType: 'Artisan & Souvenirs', status: 'APPROVED', rc: 'RC54321', ice: 'ICE109876', taxId: 'IF543210', docs: 'cin,rib' },
      { userId: merchants[2].id, businessName: 'Rif Organic Market', businessType: 'Grocery & Organic', status: 'PENDING', rc: 'RC11111', ice: 'ICE22222', taxId: 'IF33333', docs: 'passport' },
      { userId: merchants[1].id, businessName: 'Souss Agri Export', businessType: 'Agriculture', status: 'PENDING', rc: 'RC77777', ice: 'ICE88888', taxId: 'IF99999', docs: 'cin,rib,patent' },
      { userId: merchants[0].id, businessName: 'Blue City Tours', businessType: 'Travel Agency', status: 'REJECTED', rc: 'RC44444', ice: 'ICE55555', taxId: 'IF66666', docs: 'passport' },
    ];

    for (var mr of merRequests) {
      var mid = uuidv4();
      await db.query(
        'INSERT INTO merchant_requests (id, user_id, business_name, business_type, status, rc_number, ice_number, tax_id, documents_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [mid, mr.userId, mr.businessName, mr.businessType, mr.status, mr.rc, mr.ice, mr.taxId, mr.docs, daysAgo(rng(5, 45))]
      );

      if (mr.status === 'APPROVED') {
        await db.query(
          'INSERT INTO merchants (id, user_id, business_name, business_type, status, rc_number, ice_number, tax_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), mr.userId, mr.businessName, mr.businessType, 'active', mr.rc, mr.ice, mr.taxId, daysAgo(rng(5, 40))]
        );
        await db.query(
          'INSERT INTO wallet_accounts (id, user_id, balance, currency, type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), mr.userId, rng(5000, 100000), 'MAD', 'merchant', 'active', daysAgo(rng(5, 40))]
        );
      }
    }
    console.log('--- ' + merRequests.length + ' merchant requests created ---');

    // ── KYC VERIFICATIONS (3) ──
    var kycUsers = [USERS[2], USERS[3], USERS[7]];
    var kycStatuses = ['VERIFIED', 'PENDING', 'REJECTED'];
    for (var i = 0; i < kycUsers.length; i++) {
      var kid = uuidv4();
      await db.query(
        'INSERT INTO kyc_verifications (id, user_id, status, risk_score, submitted_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [kid, kycUsers[i].id, kycStatuses[i], rng(30, 95), daysAgo(rng(3, 30)), daysAgo(rng(3, 30))]
      );
      await db.query(
        'INSERT INTO kyc_documents (id, verification_id, user_id, type, file_path, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), kid, kycUsers[i].id, 'CIN_RECTO', '/uploads/kyc/' + kycUsers[i].id + '_cin_recto.jpg', 'cin_recto.jpg', daysAgo(rng(3, 30))]
      );
      await db.query(
        'INSERT INTO kyc_documents (id, verification_id, user_id, type, file_path, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), kid, kycUsers[i].id, 'CIN_VERSO', '/uploads/kyc/' + kycUsers[i].id + '_cin_verso.jpg', 'cin_verso.jpg', daysAgo(rng(3, 30))]
      );
    }
    console.log('--- ' + kycUsers.length + ' KYC verifications created ---');

    // ── TRANSACTIONS (20) ──
    var regularUsers = USERS.filter(function(u) { return u.role === 'ROLE_USER' && u.status !== 'suspended'; });
    var cashAccs = function(uid) { return walletIds[uid]; };

    var txTypes = ['P2P', 'DEPOSIT', 'WITHDRAWAL', 'PAYMENT'];
    var txStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'FAILED'];

    for (var i = 0; i < 20; i++) {
      var idx1 = rng(0, regularUsers.length - 1);
      var fromUser = regularUsers[idx1];
      var eligibleTo = regularUsers.filter(function(u) { return u.id !== fromUser.id; });
      var idx2 = rng(0, eligibleTo.length - 1);
      var toUser = eligibleTo[idx2];
      var fromW = cashAccs(fromUser.id);
      var toW = cashAccs(toUser.id);
      var txType = txTypes[i % txTypes.length];
      var amount = rng(50, 5000);
      var tid = uuidv4();

      var senderWallet = fromW.mad;
      var receiverWallet = toW ? toW.mad : null;
      var currency = 'MAD';
      var fee = 0;

      if (txType === 'P2P') {
        fee = amount * 0.025;
      } else if (txType === 'DEPOSIT') {
        senderWallet = null;
        receiverWallet = fromW.mad;
        fee = amount * 0.01;
      } else if (txType === 'WITHDRAWAL') {
        senderWallet = fromW.mad;
        receiverWallet = null;
        fee = amount * 0.02;
      } else if (txType === 'PAYMENT') {
        var merchArr = USERS.filter(function(u) { return u.role === 'ROLE_MERCHANT'; });
        var merch = merchArr[rng(0, merchArr.length - 1)];
        var merchW = walletIds[merch.id];
        senderWallet = fromW.mad;
        receiverWallet = merchW.mad;
        fee = amount * 0.015;
      }

      var status = txStatuses[rng(0, txStatuses.length - 1)];
      var txTime = daysAgo(rng(0, 30));

      await db.query(
        'INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, fee, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [tid, senderWallet, receiverWallet, amount, currency, txType, status, fee, txType + ' transaction #' + (i + 1), txTime]
      );

      if (status === 'COMPLETED' && senderWallet) {
        await db.query('UPDATE wallet_accounts SET balance = balance - ? WHERE id = ?', [amount + fee, senderWallet]);
      }
      if (status === 'COMPLETED' && receiverWallet) {
        await db.query('UPDATE wallet_accounts SET balance = balance + ? WHERE id = ?', [amount, receiverWallet]);
      }
    }
    console.log('--- 20 transactions created ---');

    // ── DISPUTES (2) ──
    var [txRows] = await db.query('SELECT id, amount, currency, sender_wallet_id FROM transactions LIMIT 10');
    if (txRows.length >= 2) {
      await db.query(
        'INSERT INTO disputes (id, transaction_id, user_id, reason, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), txRows[0].id, USERS[2].id, 'UNAUTHORIZED_TRANSACTION', 'I did not authorize this payment. The transaction was made without my consent.', 'OPEN', daysAgo(2)]
      );
      await db.query(
        'INSERT INTO disputes (id, transaction_id, user_id, reason, description, status, resolution_note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), txRows[1].id, USERS[3].id, 'GOODS_NOT_RECEIVED', 'I paid for the items but never received them. The merchant stopped responding.', 'RESOLVED', 'Refund issued after verifying the claim with the merchant.', daysAgo(10)]
      );
      console.log('--- 2 disputes created ---');
    }

    // ── AUDIT LOGS (10) ──
    var auditActions = [
      'USER_LOGIN', 'USER_REGISTER', 'PROFILE_UPDATE', 'TRANSACTION_CREATED',
      'KYC_SUBMITTED', 'MERCHANT_REQUESTED', 'DISPUTE_CREATED', 'PASSWORD_CHANGE',
      'WITHDRAWAL_REQUESTED', 'MFA_ENABLED'
    ];
    for (var i = 0; i < 10; i++) {
      var targetUser = USERS[rng(0, USERS.length - 1)];
      await db.query(
        'INSERT INTO audit_logs (id, user_id, action, resource, resource_id, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), targetUser.id, auditActions[i], auditActions[i].toLowerCase().replace('_', '-'), uuidv4().slice(0, 13), JSON.stringify({ timestamp: daysAgo(i * 2) }), '192.168.1.' + rng(1, 255), daysAgo(i * 2)]
      );
    }
    console.log('--- 10 audit logs created ---');

    // ── NOTIFICATIONS (10) ──
    for (var i = 0; i < USERS.length; i++) {
      var u = USERS[i];
      if (u.role === 'ROLE_ADMIN') continue;
      await db.query(
        'INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), u.id, 'SYSTEM', 'Welcome to Marjane Wallet', 'Your account has been created successfully. Start exploring our financial services.', i === 0 ? 0 : 1, daysAgo(rng(5, 30))]
      );
      await db.query(
        'INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), u.id, 'SECURITY_ALERT', 'MFA Recommended', 'Enable multi-factor authentication for enhanced account security.', 1, daysAgo(rng(4, 25))]
      );
    }
    // Admin gets a few system notifications
    await db.query(
      'INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), USERS[1].id, 'SYSTEM_ANNOUNCEMENT', 'New KYC Pending', 'A new KYC verification request requires your review.', 0, daysAgo(1)]
    );
    await db.query(
      'INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), USERS[1].id, 'DISPUTE', 'New Dispute Opened', 'A user has opened a dispute for transaction. Review in Dispute Center.', 0, daysAgo(2)]
    );
    await db.query(
      'INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), USERS[1].id, 'SYSTEM_ANNOUNCEMENT', 'Merchant Request Pending', 'A new merchant onboarding request is awaiting review.', 1, daysAgo(5)]
    );
    console.log('--- Notifications created ---');

    console.log('');
    console.log('Seed complete!');
    console.log('Admin: admin@marjane.ma / admin123');
    console.log('Demo: demo@marjane.ma / marjane2026');
    console.log('All other users: {email} / marjane2026');
    console.log('MFA Code: 123456');

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

main();
