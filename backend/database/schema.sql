CREATE DATABASE IF NOT EXISTS marjane_wallet;
USE marjane_wallet;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(255) UNIQUE,
    role VARCHAR(20) DEFAULT 'ROLE_USER',
    status VARCHAR(20) DEFAULT 'active',
    tier VARCHAR(20) DEFAULT 'FREE',
    tier_id VARCHAR(36),
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    email_verification_code VARCHAR(10),
    phone_verification_code VARCHAR(10),
    verification_expires DATETIME,
    face_descriptor JSON,
    mfa_code VARCHAR(10),
    mfa_expires DATETIME,
    kyc_status VARCHAR(20) DEFAULT 'UNVERIFIED',
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tiers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    fee_percent DECIMAL(5,2) DEFAULT 0.00,
    daily_limit DECIMAL(12,2) DEFAULT 50000.00,
    monthly_limit DECIMAL(12,2) DEFAULT 500000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO tiers (id, name, fee_percent, daily_limit, monthly_limit) VALUES
    ('tier-free', 'FREE', 2.5, 5000, 50000),
    ('tier-bronze', 'BRONZE', 1.5, 10000, 100000),
    ('tier-silver', 'SILVER', 1.0, 20000, 200000),
    ('tier-gold', 'GOLD', 0.5, 50000, 500000),
    ('tier-premium', 'PREMIUM', 0.0, 100000, 1000000),
    ('tier-ultimate', 'ULTIMATE', 0.0, 500000, 5000000);

CREATE TABLE IF NOT EXISTS wallet_accounts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    type VARCHAR(10) DEFAULT 'fiat' COMMENT 'fiat or crypto',
    status VARCHAR(20) DEFAULT 'active' COMMENT 'active or pending_regulation',
    label VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_currency (user_id, currency),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Legacy wallets table kept for backward compatibility; new code uses wallet_accounts
CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'MAD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    sender_wallet_id VARCHAR(36),
    receiver_wallet_id VARCHAR(36),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    device VARCHAR(255),
    ip VARCHAR(45),
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    device_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cards (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    wallet_id VARCHAR(36),
    card_number VARCHAR(20) NOT NULL,
    card_holder VARCHAR(100),
    expiry_date VARCHAR(5),
    cvv VARCHAR(4),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    response_status INT NOT NULL,
    response_body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_key (user_id, idempotency_key)
);

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
);

CREATE TABLE IF NOT EXISTS risk_events (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    event_type VARCHAR(50) NOT NULL,
    risk_score INT DEFAULT 0,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'MAD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO ledger_accounts (id, name, type) VALUES
    ('system-bank-account', 'Marjane Reserve Bank', 'ASSET'),
    ('system-fees-account', 'Transaction Fees Revenue', 'REVENUE');

CREATE TABLE IF NOT EXISTS ledger_entries (
    id VARCHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

CREATE TABLE IF NOT EXISTS exchange_rates (
    id VARCHAR(36) PRIMARY KEY,
    base_currency VARCHAR(3) DEFAULT 'MAD',
    target_currency VARCHAR(3) NOT NULL,
    buy_rate DECIMAL(10,6) NOT NULL COMMENT 'How many target units per 1 MAD (system sells MAD)',
    sell_rate DECIMAL(10,6) NOT NULL COMMENT 'How many target units per 1 MAD (system buys MAD)',
    source VARCHAR(50) DEFAULT 'seed' COMMENT 'frankfurter, exchangerate-api, coingecko, seed',
    last_fetched_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pair (base_currency, target_currency)
);

INSERT IGNORE INTO exchange_rates (id, base_currency, target_currency, buy_rate, sell_rate) VALUES
    (UUID(), 'MAD', 'USD', 0.101000, 0.095000),
    (UUID(), 'MAD', 'EUR', 0.093000, 0.088000),
    (UUID(), 'MAD', 'GBP', 0.079000, 0.074000);

CREATE TABLE IF NOT EXISTS currency_conversions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    gross_amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(15, 2) DEFAULT 0.00,
    fee_percent DECIMAL(5, 2) DEFAULT 0.00,
    rate DECIMAL(10, 6) NOT NULL,
    net_amount DECIMAL(15, 2) NOT NULL,
    transaction_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dispute_messages (
    id VARCHAR(36) PRIMARY KEY,
    dispute_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispute_evidence (
    id VARCHAR(36) PRIMARY KEY,
    dispute_id VARCHAR(36) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchant_users (
    id VARCHAR(36) PRIMARY KEY,
    merchant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) DEFAULT 'OWNER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchant_wallets (
    id VARCHAR(36) PRIMARY KEY,
    merchant_id VARCHAR(36) NOT NULL,
    balance DECIMAL(20, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'MAD',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchant_settlements (
    id VARCHAR(36) PRIMARY KEY,
    merchant_id VARCHAR(36) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MAD',
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_limits (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    daily_transfer_limit DECIMAL(12,2) DEFAULT 5000.00,
    monthly_transfer_limit DECIMAL(12,2) DEFAULT 50000.00,
    daily_withdrawal_limit DECIMAL(12,2) DEFAULT 10000.00,
    monthly_withdrawal_limit DECIMAL(12,2) DEFAULT 100000.00,
    daily_deposit_limit DECIMAL(12,2) DEFAULT 20000.00,
    monthly_deposit_limit DECIMAL(12,2) DEFAULT 200000.00,
    currency VARCHAR(10) DEFAULT 'MAD',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kyc_verifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'UNVERIFIED',
    risk_score INT DEFAULT 0,
    rejection_reason TEXT,
    submitted_at DATETIME,
    reviewed_at DATETIME,
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kyc_documents (
    id VARCHAR(36) PRIMARY KEY,
    verification_id VARCHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (verification_id) REFERENCES kyc_verifications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kyc_reviews (
    id VARCHAR(36) PRIMARY KEY,
    verification_id VARCHAR(36) NOT NULL,
    action VARCHAR(30) NOT NULL,
    note TEXT,
    reviewed_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (verification_id) REFERENCES kyc_verifications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_read (user_id, is_read)
);

CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2) NOT NULL,
    points_cost INT NOT NULL DEFAULT 100,
    expiry_date DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_coupons (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    coupon_id VARCHAR(36) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
);
