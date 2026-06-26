const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

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

  // --- Users ---
  const demoUserId = uuidv4();
  const adminUserId = uuidv4();
  const hashedPassword = await bcrypt.hash('marjane2026', 10);

  await knex('users').insert([
    {
      id: demoUserId,
      name: 'Demo User',
      email: 'demo@marjane.ma',
      password: hashedPassword,
      phone: '+212600000001',
      role: 'ROLE_USER',
      status: 'active',
      tier: 'BRONZE',
      is_email_verified: true,
      is_phone_verified: true,
      kyc_status: 'VERIFIED',
      loyalty_points: 250,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: adminUserId,
      name: 'Admin User',
      email: 'admin@marjane.ma',
      password: hashedPassword,
      phone: '+212600000000',
      role: 'ROLE_ADMIN',
      status: 'active',
      tier: 'PLATINUM',
      is_email_verified: true,
      is_phone_verified: true,
      kyc_status: 'VERIFIED',
      loyalty_points: 5000,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
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

  const walletAccounts = [];
  for (const user of [demoUserId, adminUserId]) {
    for (const cfg of walletConfigs) {
      walletAccounts.push({
        id: uuidv4(),
        user_id: user,
        currency: cfg.currency,
        balance: cfg.currency === 'MAD' ? 15000.00 : cfg.currency === 'EUR' ? 500.00 : cfg.currency === 'USD' ? 200.00 : 0,
        type: cfg.type,
        status: cfg.status,
        label: `${cfg.currency} ${cfg.type === 'crypto' ? 'Vault' : 'Account'}`,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }
  await knex('wallet_accounts').insert(walletAccounts);

  // --- Legacy wallets ---
  await knex('wallets').insert([
    { id: uuidv4(), user_id: demoUserId, balance: 15000.00, currency: 'MAD' },
    { id: uuidv4(), user_id: adminUserId, balance: 50000.00, currency: 'MAD' },
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
    await knex('exchange_rates').insert({ id: uuidv4(), ...r, last_fetched_at: knex.fn.now() });
  }

  // --- Ledger Accounts ---
  await knex('ledger_accounts').insert([
    { id: 'system-bank-account', name: 'Marjane Reserve Bank', type: 'ASSET', balance: 0, currency: 'MAD' },
    { id: 'system-fees-account', name: 'Transaction Fees Revenue', type: 'REVENUE', balance: 0, currency: 'MAD' },
  ]);

  // --- Wallet Limits ---
  await knex('wallet_limits').insert([
    { id: uuidv4(), user_id: demoUserId },
    { id: uuidv4(), user_id: adminUserId },
  ]);

  // --- Sample Transaction ---
  await knex('transactions').insert({
    id: uuidv4(),
    sender_wallet_id: adminUserId,
    receiver_wallet_id: demoUserId,
    amount: 100.00,
    currency: 'MAD',
    type: 'TRANSFER',
    status: 'COMPLETED',
    note: 'Welcome bonus',
    created_at: knex.fn.now(),
  });
};
