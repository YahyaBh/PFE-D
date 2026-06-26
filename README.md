# Marjane Wallet — Moroccan Digital Wallet Platform

A full-featured multi-currency digital wallet platform for Morocco, supporting MAD, EUR, USD (fiat) and BTC, ETH, USDT (crypto) with glassmorphism UI, real-time notifications, merchant payments, and double-entry ledger accounting.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Recharts, GSAP |
| **Backend** | Node.js, Express, MySQL 8, JWT, Bcrypt |
| **Accounting** | Double-entry ledger (debit/credit), idempotency keys |
| **Auth** | JWT access + refresh tokens, TOTP MFA, session management |
| **Real-time** | SSE (Server-Sent Events) for notifications |
| **Crypto** | Live rates via CoinGecko, deterministic address generation |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Dashboard│  │  Wallet  │  │ Merchant │  │ Admin  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       └──────────────┴─────────────┴────────────┘      │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST + SSE
┌──────────────────────────▼──────────────────────────────┐
│                    Backend (Express)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │   Auth   │  │  Wallet  │  │   Ledger (Double-    │  │
│  │ Service  │  │  Service │  │   Entry Accounting)  │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Exchange │  │ Merchant │  │  Notifications (SSE) │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    MySQL 8 Database                      │
│  26 tables: users, wallet_accounts, transactions,       │
│  ledger_entries, cards, exchange_rates, merchants,      │
│  kyc_verifications, disputes, notifications, etc.       │
└─────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Node.js 18+
- MySQL 8+
- npm 9+

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env.development
# Edit .env.development with your database credentials
# Default: mysql://root@localhost:3306/marjane_wallet
npm run migrate
npm run seed
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local if needed (default: http://localhost:5000/api)
npm run dev
```

### Docker (One Command)

```bash
docker-compose up
```

## Demo Credentials

| Role | Email | Password | MFA Code |
|------|-------|----------|----------|
| **User** | `demo@marjane.ma` | `marjane2026` | `123456` |
| **Admin** | `admin@marjane.ma` | `marjane2026` | `123456` |

## API Documentation

See [docs/API.md](docs/API.md) for full endpoint reference.

## Key Features

- **Multi-currency**: MAD, EUR, USD plus BTC, ETH, USDT — 6 wallets per user
- **Live Exchange Rates**: Frankfurter.app + ExchangeRate-API + CoinGecko
- **Fee Structure**: 0% same-currency P2P, 2.5% cross-currency, 2% MAD withdrawal
- **Cards**: Virtual MAD cards with refill, freeze, and 5 regenerations/month
- **Merchant Hub**: QR payments, settlement requests, sales analytics
- **KYC**: Document upload with AI auto-verification, 5-step status tracking
- **Loyalty Tiers**: Bronze → Silver → Gold → Platinum with increasing limits
- **Notifications**: Real-time SSE push for transactions and alerts
- **Disputes**: Resolution center with evidence upload and messaging
- **Admin Panel**: User management, transaction reversal, system audit

## License

Proprietary — Marjane Wallet
