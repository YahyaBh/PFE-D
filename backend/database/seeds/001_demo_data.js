const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Deterministic IDs for demo user (consistent across seed runs)
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_WALLET_MAD = '10000000-0000-0000-0000-000000000001';
const DEMO_WALLET_EUR = '10000000-0000-0000-0000-000000000002';
const DEMO_WALLET_USD = '10000000-0000-0000-0000-000000000003';
const DEMO_WALLET_BTC = '10000000-0000-0000-0000-000000000004';
const DEMO_WALLET_ETH = '10000000-0000-0000-0000-000000000005';
const DEMO_WALLET_USDT = '10000000-0000-0000-0000-000000000006';
const ADMIN_WALLET_MAD = '20000000-0000-0000-0000-000000000001';
const ADMIN_WALLET_EUR = '20000000-0000-0000-0000-000000000002';
const ADMIN_WALLET_USD = '20000000-0000-0000-0000-000000000003';

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 19).replace('T', ' ');
}

exports.seed = async function (knex) {
  // Clean existing data
  await knex('user_coupons').del();
  await knex('coupons').del();
  await knex('notifications').del();
  await knex('kyc_reviews').del();
  await knex('kyc_documents').del();
  await knex('kyc_verifications').del();
  await knex('wallet_limits').del();
  await knex('merchant_settlements').del();
  await knex('merchant_wallets').del();
  await knex('merchant_users').del();
  await knex('merchants').del();
  await knex('currency_conversions').del();
  await knex('exchange_rates').del();
  await knex('dispute_evidence').del();
  await knex('dispute_messages').del();
  await knex('disputes').del();
  await knex('ledger_entries').del();
  await knex('ledger_accounts').del();
  await knex('risk_events').del();
  await knex('audit_logs').del();
  await knex('idempotency_keys').del();
  await knex('cards').del();
  await knex('device_sessions').del();
  await knex('refresh_tokens').del();
  await knex('transactions').del();
  await knex('wallets').del();
  await knex('wallet_accounts').del();
  await knex('tiers').del();
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('marjane2026', 10);
  const now = knex.fn.now();

  // --- Users (10 total: demo, admin + 3 additional) ---
  const userIds = {
    demo: DEMO_USER_ID,
    admin: ADMIN_USER_ID,
    fatima: uuidv4(),
    youssef: uuidv4(),
    aicha: uuidv4(),
  };

  await knex('users').insert([
    {
      id: userIds.demo, name: 'Demo User', email: 'demo@marjane.ma',
      password: hashedPassword, phone: '+212600000001', role: 'ROLE_USER',
      status: 'active', tier: 'BRONZE', is_email_verified: true,
      is_phone_verified: true, kyc_status: 'VERIFIED',
      loyalty_points: 250, created_at: daysAgo(60), updated_at: now,
    },
    {
      id: userIds.admin, name: 'Admin User', email: 'admin@marjane.ma',
      password: hashedPassword, phone: '+212600000000', role: 'ROLE_ADMIN',
      status: 'active', tier: 'PLATINUM', is_email_verified: true,
      is_phone_verified: true, kyc_status: 'VERIFIED',
      loyalty_points: 5000, created_at: daysAgo(60), updated_at: now,
    },
    {
      id: userIds.fatima, name: 'Fatima Zahra', email: 'fatima.zahra@marjane.ma',
      password: hashedPassword, phone: '+212600000002', role: 'ROLE_USER',
      status: 'active', tier: 'SILVER', is_email_verified: true,
      is_phone_verified: true, kyc_status: 'VERIFIED',
      loyalty_points: 580, created_at: daysAgo(45), updated_at: now,
    },
    {
      id: userIds.youssef, name: 'Youssef Benali', email: 'youssef.benali@marjane.ma',
      password: hashedPassword, phone: '+212600000003', role: 'ROLE_USER',
      status: 'active', tier: 'FREE', is_email_verified: true,
      is_phone_verified: true, kyc_status: 'VERIFIED',
      loyalty_points: 120, created_at: daysAgo(30), updated_at: now,
    },
    {
      id: userIds.aicha, name: 'Aicha El Idrissi', email: 'aicha.elidrissi@marjane.ma',
      password: hashedPassword, phone: '+212600000004', role: 'ROLE_USER',
      status: 'active', tier: 'BRONZE', is_email_verified: true,
      is_phone_verified: true, kyc_status: 'VERIFIED',
      loyalty_points: 340, created_at: daysAgo(20), updated_at: now,
    },
  ]);

  // --- Tiers ---
  await knex('tiers').insert([
    { id: 'tier-free', name: 'FREE', fee_percent: 2.5, daily_limit: 5000, monthly_limit: 50000 },
    { id: 'tier-bronze', name: 'BRONZE', fee_percent: 1.5, daily_limit: 10000, monthly_limit: 100000 },
    { id: 'tier-silver', name: 'SILVER', fee_percent: 1.0, daily_limit: 20000, monthly_limit: 200000 },
    { id: 'tier-gold', name: 'GOLD', fee_percent: 0.5, daily_limit: 50000, monthly_limit: 500000 },
    { id: 'tier-premium', name: 'PREMIUM', fee_percent: 0.0, daily_limit: 100000, monthly_limit: 1000000 },
    { id: 'tier-ultimate', name: 'ULTIMATE', fee_percent: 0.0, daily_limit: 500000, monthly_limit: 5000000 },
  ]);

  // --- Wallet Accounts (6 per user) ---
  const walletConfigs = [
    { currency: 'MAD', type: 'fiat', status: 'active' },
    { currency: 'EUR', type: 'fiat', status: 'active' },
    { currency: 'USD', type: 'fiat', status: 'active' },
    { currency: 'BTC', type: 'crypto', status: 'pending_regulation' },
    { currency: 'ETH', type: 'crypto', status: 'pending_regulation' },
    { currency: 'USDT', type: 'crypto', status: 'pending_regulation' },
  ];

  const walletIds = {
    demo: { MAD: DEMO_WALLET_MAD, EUR: DEMO_WALLET_EUR, USD: DEMO_WALLET_USD, BTC: DEMO_WALLET_BTC, ETH: DEMO_WALLET_ETH, USDT: DEMO_WALLET_USDT },
    admin: { MAD: ADMIN_WALLET_MAD, EUR: ADMIN_WALLET_EUR, USD: ADMIN_WALLET_USD },
  };

  const walletBalances = {
    demo: { MAD: 18420.50, EUR: 1250.00, USD: 680.00, BTC: 0, ETH: 0, USDT: 0 },
    admin: { MAD: 50000.00, EUR: 3000.00, USD: 1500.00 },
    fatima: { MAD: 8200.00, EUR: 400.00, USD: 200.00, BTC: 0, ETH: 0, USDT: 0 },
    youssef: { MAD: 3500.00, EUR: 150.00, USD: 50.00, BTC: 0, ETH: 0, USDT: 0 },
    aicha: { MAD: 12500.00, EUR: 600.00, USD: 300.00, BTC: 0, ETH: 0, USDT: 0 },
  };

  for (const [userKey, userId] of Object.entries(userIds)) {
    const bal = walletBalances[userKey];
    for (const cfg of walletConfigs) {
      const wid = walletIds[userKey]?.[cfg.currency] || uuidv4();
      if (!walletIds[userKey]) walletIds[userKey] = {};
      walletIds[userKey][cfg.currency] = wid;

      await knex('wallet_accounts').insert({
        id: wid,
        user_id: userId,
        currency: cfg.currency,
        balance: bal[cfg.currency],
        type: cfg.type,
        status: cfg.status,
        label: `${cfg.currency} ${cfg.type === 'crypto' ? 'Vault' : 'Account'}`,
        created_at: daysAgo(60),
        updated_at: now,
      });
    }
  }

  // --- Legacy wallets ---
  await knex('wallets').insert([
    { id: uuidv4(), user_id: userIds.demo, balance: 18420.50, currency: 'MAD' },
    { id: uuidv4(), user_id: userIds.admin, balance: 50000.00, currency: 'MAD' },
    { id: uuidv4(), user_id: userIds.fatima, balance: 8200.00, currency: 'MAD' },
    { id: uuidv4(), user_id: userIds.youssef, balance: 3500.00, currency: 'MAD' },
    { id: uuidv4(), user_id: userIds.aicha, balance: 12500.00, currency: 'MAD' },
  ]);

  // --- Exchange Rates ---
  const rates = [
    { base_currency: 'MAD', target_currency: 'USD', buy_rate: 0.101000, sell_rate: 0.095000, source: 'seed' },
    { base_currency: 'MAD', target_currency: 'EUR', buy_rate: 0.093000, sell_rate: 0.088000, source: 'seed' },
    { base_currency: 'MAD', target_currency: 'GBP', buy_rate: 0.079000, sell_rate: 0.074000, source: 'seed' },
    { base_currency: 'EUR', target_currency: 'MAD', buy_rate: 10.750000, sell_rate: 10.500000, source: 'seed' },
    { base_currency: 'USD', target_currency: 'MAD', buy_rate: 9.900000, sell_rate: 9.700000, source: 'seed' },
  ];
  for (const r of rates) {
    await knex('exchange_rates').insert({ id: uuidv4(), ...r, last_fetched_at: now });
  }

  // --- Ledger Accounts ---
  await knex('ledger_accounts').insert([
    { id: 'system-bank-account', name: 'Marjane Reserve Bank', type: 'ASSET', balance: 0, currency: 'MAD' },
    { id: 'system-fees-account', name: 'Transaction Fees Revenue', type: 'REVENUE', balance: 0, currency: 'MAD' },
  ]);

  // --- Wallet Limits ---
  await knex('wallet_limits').insert([
    { id: uuidv4(), user_id: userIds.demo },
    { id: uuidv4(), user_id: userIds.admin },
    { id: uuidv4(), user_id: userIds.fatima },
    { id: uuidv4(), user_id: userIds.youssef },
    { id: uuidv4(), user_id: userIds.aicha },
  ]);

  // --- Rich Transaction History (30+ transactions across 30 days) ---
  const transactions = [
    // Day 1-5: Initial deposits
    { sender: null, receiver: DEMO_WALLET_MAD, amount: 5000.00, currency: 'MAD', type: 'DEPOSIT', status: 'COMPLETED', note: 'Bank deposit - CIH', days: 30 },
    { sender: null, receiver: DEMO_WALLET_EUR, amount: 1000.00, currency: 'EUR', type: 'DEPOSIT', status: 'COMPLETED', note: 'Bank deposit - BMCE', days: 29 },
    { sender: null, receiver: DEMO_WALLET_USD, amount: 500.00, currency: 'USD', type: 'DEPOSIT', status: 'COMPLETED', note: 'Card deposit', days: 28 },
    { sender: null, receiver: DEMO_WALLET_MAD, amount: 2000.00, currency: 'MAD', type: 'DEPOSIT', status: 'COMPLETED', note: 'Cash deposit at Marjane store', days: 27 },

    // Day 6-10: P2P received from other users
    { sender: ADMIN_WALLET_MAD, receiver: DEMO_WALLET_MAD, amount: 500.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Welcome bonus from admin', days: 26 },
    { sender: walletIds.fatima.MAD, receiver: DEMO_WALLET_MAD, amount: 200.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Payment for dinner', days: 25 },
    { sender: walletIds.youssef.MAD, receiver: DEMO_WALLET_MAD, amount: 350.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Shared taxi fare', days: 24 },

    // Day 11-15: P2P sent to others
    { sender: DEMO_WALLET_MAD, receiver: walletIds.fatima.MAD, amount: 150.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Gift for Fatima', days: 23 },
    { sender: DEMO_WALLET_MAD, receiver: walletIds.youssef.MAD, amount: 80.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Coffee meetup share', days: 22 },
    { sender: DEMO_WALLET_MAD, receiver: walletIds.aicha.MAD, amount: 200.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Team lunch contribution', days: 21 },

    // Day 16-20: Card refills and QR payments
    { sender: DEMO_WALLET_MAD, receiver: null, amount: 500.00, currency: 'MAD', type: 'CARD_REFILL', status: 'COMPLETED', note: 'Virtual card top-up', days: 20 },
    { sender: DEMO_WALLET_MAD, receiver: null, amount: 230.00, currency: 'MAD', type: 'QR_PAYMENT', status: 'COMPLETED', note: 'Payment at Marjane Market - Casa', days: 19 },
    { sender: DEMO_WALLET_MAD, receiver: null, amount: 89.50, currency: 'MAD', type: 'QR_PAYMENT', status: 'COMPLETED', note: 'Coffee at Starbucks Morocco Mall', days: 18 },
    { sender: DEMO_WALLET_MAD, receiver: null, amount: 1200.00, currency: 'MAD', type: 'WITHDRAWAL', status: 'COMPLETED', note: 'ATM withdrawal - BMCE', days: 17 },

    // Day 21-25: Cross-currency and more transactions
    { sender: DEMO_WALLET_EUR, receiver: DEMO_WALLET_MAD, amount: 200.00, currency: 'EUR', type: 'CONVERSION', status: 'COMPLETED', note: 'EUR to MAD conversion (fee: 2.5%)', days: 16 },
    { sender: DEMO_WALLET_USD, receiver: DEMO_WALLET_MAD, amount: 100.00, currency: 'USD', type: 'CONVERSION', status: 'COMPLETED', note: 'USD to MAD conversion', days: 15 },
    { sender: null, receiver: DEMO_WALLET_MAD, amount: 3000.00, currency: 'MAD', type: 'DEPOSIT', status: 'COMPLETED', note: 'Salary deposit - Employer', days: 14 },
    { sender: DEMO_WALLET_MAD, receiver: walletIds.aicha.MAD, amount: 500.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Rent contribution', days: 13 },
    { sender: walletIds.aicha.MAD, receiver: DEMO_WALLET_MAD, amount: 120.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Groceries split', days: 12 },

    // Day 26-30: Recent transactions
    { sender: null, receiver: DEMO_WALLET_MAD, amount: 1000.00, currency: 'MAD', type: 'DEPOSIT', status: 'COMPLETED', note: 'Bank transfer - Attijariwafa', days: 10 },
    { sender: DEMO_WALLET_MAD, receiver: null, amount: 350.00, currency: 'MAD', type: 'CARD_REFILL', status: 'COMPLETED', note: 'Card top-up for shopping', days: 8 },
    { sender: DEMO_WALLET_MAD, receiver: null, amount: 175.00, currency: 'MAD', type: 'QR_PAYMENT', status: 'COMPLETED', note: 'Carrefour Market - Rabat', days: 7 },
    { sender: DEMO_WALLET_MAD, receiver: walletIds.fatima.MAD, amount: 60.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Birthday gift', days: 5 },
    { sender: DEMO_WALLET_MAD, receiver: null, amount: 45.00, currency: 'MAD', type: 'QR_PAYMENT', status: 'COMPLETED', note: 'McDonalds - Mega Mall', days: 4 },
    { sender: DEMO_WALLET_MAD, receiver: null, amount: 800.00, currency: 'MAD', type: 'WITHDRAWAL', status: 'COMPLETED', note: 'ATM withdrawal', days: 3 },
    { sender: DEMO_WALLET_MAD, receiver: walletIds.aicha.MAD, amount: 100.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Split for internet bill', days: 2 },
    { sender: ADMIN_WALLET_MAD, receiver: DEMO_WALLET_MAD, amount: 200.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Promotional credit', days: 1 },
    { sender: walletIds.youssef.MAD, receiver: DEMO_WALLET_MAD, amount: 75.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Refund shared expense', days: 0 },

    // Admin transactions for dashboard chart
    { sender: null, receiver: ADMIN_WALLET_MAD, amount: 25000.00, currency: 'MAD', type: 'DEPOSIT', status: 'COMPLETED', note: 'Funding', days: 28 },
    { sender: ADMIN_WALLET_MAD, receiver: walletIds.fatima.MAD, amount: 1000.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Reward distribution', days: 20 },
    { sender: ADMIN_WALLET_MAD, receiver: walletIds.aicha.MAD, amount: 500.00, currency: 'MAD', type: 'TRANSFER', status: 'COMPLETED', note: 'Promotional credit', days: 15 },
    { sender: ADMIN_WALLET_EUR, receiver: ADMIN_WALLET_MAD, amount: 500.00, currency: 'EUR', type: 'CONVERSION', status: 'COMPLETED', note: 'EUR to MAD conversion', days: 10 },

    // Pending transactions
    { sender: DEMO_WALLET_MAD, receiver: walletIds.fatima.MAD, amount: 250.00, currency: 'MAD', type: 'TRANSFER', status: 'PENDING', note: 'Pending transfer', days: 1 },
  ];

  for (const tx of transactions) {
    await knex('transactions').insert({
      id: uuidv4(),
      sender_wallet_id: tx.sender,
      receiver_wallet_id: tx.receiver,
      amount: tx.amount,
      currency: tx.currency,
      type: tx.type,
      status: tx.status,
      note: tx.note,
      created_at: daysAgo(tx.days),
    });
  }

  // --- Cards ---
  await knex('cards').insert({
    id: uuidv4(),
    user_id: userIds.demo,
    wallet_id: DEMO_WALLET_MAD,
    card_number: '4532 7812 9045 6210',
    card_holder: 'DEMO USER',
    expiry_date: '08/28',
    cvv: '123',
    status: 'ACTIVE',
    balance: 500.00,
    created_at: daysAgo(20),
  });
  await knex('cards').insert({
    id: uuidv4(),
    user_id: userIds.admin,
    wallet_id: ADMIN_WALLET_MAD,
    card_number: '4916 2334 1189 7722',
    card_holder: 'ADMIN USER',
    expiry_date: '12/27',
    cvv: '456',
    status: 'ACTIVE',
    balance: 2500.00,
    created_at: daysAgo(30),
  });

  // --- Notifications ---
  const notificationDefs = [
    // Demo user notifications
    { user: 'demo', title: 'Payment Received', message: 'You received 200.00 MAD from Youssef Benali', type: 'TRANSFER', is_read: false, days: 0 },
    { user: 'demo', title: 'Card Refill Successful', message: 'Your virtual card has been topped up with 350.00 MAD', type: 'CARD', is_read: false, days: 1 },
    { user: 'demo', title: 'Security Alert', message: 'New login from Chrome browser on Windows', type: 'SECURITY', is_read: false, days: 2 },
    { user: 'demo', title: 'Deposit Confirmed', message: 'Bank deposit of 1,000.00 MAD has been credited', type: 'DEPOSIT', is_read: true, days: 5 },
    { user: 'demo', title: 'Welcome to Marjane Wallet', message: 'Thank you for joining! Your wallet is ready.', type: 'SYSTEM', is_read: true, days: 30 },
    { user: 'demo', title: 'QR Payment Successful', message: 'Payment of 175.00 MAD at Carrefour Market completed', type: 'QR_PAYMENT', is_read: true, days: 7 },
    { user: 'demo', title: 'Transfer Sent', message: 'You sent 60.00 MAD to Fatima Zahra', type: 'TRANSFER', is_read: true, days: 5 },
    { user: 'demo', title: 'Loyalty Points Earned', message: 'You earned 25 points from your recent transaction', type: 'SYSTEM', is_read: true, days: 10 },

    // Admin notifications
    { user: 'admin', title: 'New User Registered', message: 'Aicha El Idrissi has joined the platform', type: 'USER', is_read: false, days: 0 },
    { user: 'admin', title: 'Merchant Request Pending', message: 'Marjane Market Casa has requested merchant approval', type: 'MERCHANT', is_read: false, days: 1 },
    { user: 'admin', title: 'High-Value Transfer Alert', message: 'Transfer of 25,000.00 MAD detected', type: 'SYSTEM', is_read: false, days: 2 },
    { user: 'admin', title: 'KYC Review Needed', message: '3 documents pending review', type: 'KYC', is_read: true, days: 3 },
    { user: 'admin', title: 'System Health Check', message: 'All services operational', type: 'SYSTEM', is_read: true, days: 5 },
  ];

  for (const notif of notificationDefs) {
    const uid = notif.user === 'demo' ? userIds.demo : userIds.admin;
    await knex('notifications').insert({
      id: uuidv4(),
      user_id: uid,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      is_read: notif.is_read,
      created_at: daysAgo(notif.days),
    });
  }

  // --- Merchant (approved, linked to demo user) ---
  const merchantId = uuidv4();
  await knex('merchants').insert({
    id: merchantId,
    name: 'Marjane Market Casa',
    category: 'RETAIL',
    status: 'APPROVED',
    description: 'Flagship retail store at Casablanca Morocco Mall',
    created_at: daysAgo(30),
    updated_at: now,
  });

  await knex('merchant_users').insert({
    id: uuidv4(),
    merchant_id: merchantId,
    user_id: userIds.demo,
    role: 'OWNER',
  });

  await knex('merchant_wallets').insert({
    id: uuidv4(),
    merchant_id: merchantId,
    currency: 'MAD',
    balance: 15000.00,
    created_at: daysAgo(30),
  });

  // --- Audit Logs ---
  const auditEvents = [
    { action: 'USER_REGISTERED', entity: 'auth', user: 'demo', days: 60 },
    { action: 'LOGIN_SUCCESS', entity: 'auth', user: 'demo', days: 0 },
    { action: 'LOGIN_SUCCESS', entity: 'auth', user: 'admin', days: 0 },
    { action: 'TRANSFER_SENT', entity: 'transaction', user: 'demo', days: 2 },
    { action: 'DEPOSIT_MADE', entity: 'transaction', user: 'demo', days: 10 },
    { action: 'CARD_REFILL', entity: 'card', user: 'demo', days: 8 },
    { action: 'PROFILE_UPDATED', entity: 'user', user: 'demo', days: 15 },
  ];

  for (const ev of auditEvents) {
    const uid = ev.user === 'demo' ? userIds.demo : userIds.admin;
    await knex('audit_logs').insert({
      id: uuidv4(),
      user_id: uid,
      action: ev.action,
      entity: ev.entity,
      metadata: JSON.stringify({ ip: '127.0.0.1' }),
      created_at: daysAgo(ev.days),
    });
  }

  // --- Device Sessions ---
  await knex('device_sessions').insert([
    { id: uuidv4(), user_id: userIds.demo, device: 'Mozilla/5.0 Chrome/120.0 on Windows', ip: '127.0.0.1', last_login: now },
    { id: uuidv4(), user_id: userIds.admin, device: 'Mozilla/5.0 Chrome/120.0 on Windows', ip: '127.0.0.1', last_login: now },
  ]);

  // --- Coupons ---
  await knex('coupons').insert([
    { id: uuidv4(), code: 'WELCOME10', description: '10% off your first transfer', discount_percentage: 10.00, points_cost: 100, expiry_date: new Date(Date.now() + 90 * 86400000), is_active: true, created_at: now },
    { id: uuidv4(), code: 'FRIEND20', description: '20% off referral bonus', discount_percentage: 20.00, points_cost: 200, expiry_date: new Date(Date.now() + 60 * 86400000), is_active: true, created_at: now },
    { id: uuidv4(), code: 'GOLD5', description: '5% cashback on card payments', discount_percentage: 5.00, points_cost: 50, expiry_date: new Date(Date.now() + 30 * 86400000), is_active: true, created_at: now },
  ]);
};
