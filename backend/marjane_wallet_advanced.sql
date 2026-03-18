-- MARJANE WALLET ADVANCED PRODUCTION SCHEMA
-- Optimised for MySQL 8.0+
-- Using UUIDs (VARCHAR(36)) for enhanced security and horizontal scaling

CREATE DATABASE IF NOT EXISTS marjane_wallet;
USE marjane_wallet;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    tier ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM') DEFAULT 'BRONZE',
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    email_verification_code VARCHAR(10),
    phone_verification_code VARCHAR(10),
    verification_expires DATETIME,
    mfa_code VARCHAR(10),
    mfa_expires DATETIME,
    face_descriptor JSON,
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_phone (phone)
);

-- 2. WALLETS
CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'MAD',
    status ENUM('ACTIVE', 'FROZEN', 'TERMINATED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_wallet_user (user_id)
);

-- 3. VIRTUAL CARDS
CREATE TABLE IF NOT EXISTS cards (
    id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    card_number VARCHAR(20) NOT NULL,
    card_holder VARCHAR(100) NOT NULL,
    expiry_date VARCHAR(7) NOT NULL, -- MM/YYYY format for easier frontend handling
    cvv VARCHAR(5) NOT NULL,
    status ENUM('ACTIVE', 'FROZEN', 'TERMINATED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    INDEX idx_card_number (card_number)
);

-- 4. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    sender_wallet_id VARCHAR(36),
    receiver_wallet_id VARCHAR(36),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MAD',
    type VARCHAR(50) NOT NULL, -- transfer, deposit, withdraw, payment, refund, etc.
    status VARCHAR(20) DEFAULT 'PENDING',
    description VARCHAR(255),
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_wallet_id) REFERENCES wallets(id),
    FOREIGN KEY (receiver_wallet_id) REFERENCES wallets(id),
    INDEX idx_tx_sender (sender_wallet_id),
    INDEX idx_tx_receiver (receiver_wallet_id)
);

-- 5. MERCHANTS
CREATE TABLE IF NOT EXISTS merchants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    category VARCHAR(100),
    api_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. MERCHANT PAYMENTS (Extended logs)
CREATE TABLE IF NOT EXISTS merchant_payments (
    id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    merchant_id VARCHAR(36) NOT NULL,
    transaction_id VARCHAR(36) UNIQUE,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MAD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- 7. COUPONS & LOYALTY
CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage INT NOT NULL,
    points_cost INT DEFAULT 0,
    expiry_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_coupons (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    coupon_id VARCHAR(36) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    expired_at DATETIME, -- Snapshot of expiry at time of claim
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(30) DEFAULT 'SYSTEM',
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id)
);

-- 9. DEVICE SESSIONS (Simplified for single-device enforcement)
CREATE TABLE IF NOT EXISTS device_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    device VARCHAR(150),
    ip_address VARCHAR(50),
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_user (user_id)
);
