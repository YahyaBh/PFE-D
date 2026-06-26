# Marjane Wallet — PFE Project Structure

---

## QUICK START (For Jury Evaluation)

```bash
# Prerequisites: Node.js 18+, MySQL 8+, npm 9+

# 1. Setup backend
cd backend
npm install
# Edit .env with DB credentials (default: root@localhost:3306/marjane_wallet)
mysql -u root -e "CREATE DATABASE IF NOT EXISTS marjane_wallet;"
mysql -u root marjane_wallet < database/schema.sql
node database/seed.js      # Creates demo@marjane.ma / marjane2026
npm run dev                 # → http://localhost:5000

# 2. Setup frontend (new terminal)
cd ../frontend
npm install
npm run dev                 # → http://localhost:3000

# 3. Open http://localhost:3000
```

| Item | Value |
|------|-------|
| **Demo login** | `demo@marjane.ma` / `marjane2026` |
| **MFA code** | `123456` (any 6-char code works in dev) |
| **Admin access** | Create `ROLE_ADMIN` user in DB manually |
| **Key feature to test** | Dashboard → Transfer → QR Pay |
| **Known limitation** | No real SMTP — emails are console-logged |
| **Frontend dev** | `http://localhost:3000` |
| **Backend API** | `http://localhost:5000/api` |

---

## 1. PROJECT OVERVIEW

**Marjane Wallet** is a full-stack digital wallet platform enabling Moroccan users to manage money, make P2P transfers, issue virtual Visa-like cards, pay via QR code, earn loyalty rewards, and complete KYC verification — with optional face-biometric authentication. The platform also includes merchant and admin portals.

**Tech stack:**
- **Frontend:** Next.js 14.1.0 (React 18), TypeScript, Tailwind CSS 3, GSAP 3, face-api.js, Recharts, Lucide React
- **Backend:** Node.js, Express 4.18, MySQL 8 (via mysql2), JWT auth, bcrypt, Nodemailer
- **Database:** MySQL 8 with raw SQL queries (Prisma declared but unused)
- **Architecture:** Monolithic backend + monolithic frontend; MVC-lite pattern on backend (routes → controllers → services → repositories → MySQL)

---

## 2. DIRECTORY TREE

```
PFE-D/
├── .git/                                   # Git version control data
├── .gitattributes                          # Git LF normalization config
├── .gitignore                              # Ignores .next, node_modules, .env, logs, build artifacts
├── CLAUDE.md                               # AI coding assistant project guidelines
│
├── docs/                                   # Meta-documentation & audit reports
│   ├── INFO_AI.md                          # Full technical audit report (security, architecture, UX)
│   ├── AUDIT.md                            # Project health score: 44/100, 14 security findings
│   ├── AUDIT_CONNECTIONS.md                # System connection audit: 7 working / 7 partial / 6 broken flows
│   └── AUDIT_FUNCTIONAL.md                 # Functional completion: 58/100, 31 features scored
│
├── design-artifacts/                       # Standalone design previews
│   ├── hero-preview.html                   # Standalone HTML preview of hero section
│   └── full-preview.html                   # Full-page design preview
│
├── backend/                                # ---- BACKEND (Express + MySQL) ----
│   ├── .env                                # Environment: PORT=5000, DATABASE_URL, JWT secrets, SMTP (optional)
│   ├── .env.example                        # Template for .env with placeholder values
│   ├── package.json                        # Dependencies: express, mysql2, bcryptjs, jsonwebtoken, nodemailer, etc.
│   ├── marjane_wallet_advanced.sql         # Complete DB dump with 26 tables + seed data
│   │
│   ├── src/                                # ---- Backend source code ----
│   │   ├── app.js                          # Express entry point; mounts middleware + routes under /api
│   │   │
│   │   ├── routes/
│   │   │   └── api.js                      # 50+ route definitions; global rate limiting, auth/admin/merchant middleware
│   │   │
│   │   ├── controllers/                    # Request handlers (thin: validate → delegate to service → respond)
│   │   │   ├── authController.js           # register, login, MFA verify/resend, token verify, refresh, logout, forgot/reset password, getMe, getFaceDescriptor
│   │   │   ├── walletController.js         # getWallet, getBalance, handleDeposit, handleWithdraw
│   │   │   ├── cardController.js           # issueCard, getCards, toggleCardStatus, regenerateCard, refillCard, deleteCard
│   │   │   ├── transactionController.js    # searchUser, getRecentTransactions, getPendingRequests, requestMoney, processRequest, processQRPayment, getTransactionHistory
│   │   │   ├── transferController.js       # handleTransfer (thin delegate to transferService)
│   │   │   ├── dashboardController.js      # getDashboardStats (aggregates balances, pending, monthly spending)
│   │   │   ├── adminController.js          # getUsers, toggleUserStatus, resetUserMFA, getAllTransactions, reverseTransaction, broadcastNotification, getAuditLogs, getLedgerSummary/Entries, getSystemOverview, getKycVerifications, getMerchantRequests, approveMerchant
│   │   │   ├── merchantController.js       # getMerchantStats, getMerchantTransactions, getSettlements, requestSettlement, requestOnboarding, qrLookup
│   │   │   ├── profileController.js        # updateProfile, changePassword, getSessions, logoutAllDevices, getFaceAuthStatus, removeFaceAuth
│   │   │   ├── kycController.js            # getStatus, uploadDocument, submitVerification, getDocuments, reviewVerification, autoVerify, deleteDocument, getDocumentFile, resetStatus
│   │   │   ├── disputeController.js        # createDispute, getMyDisputes, getMessages, addMessage, uploadEvidenceHandler, getEvidenceList, getEvidenceFile, adminGetAllDisputes, resolveDispute
│   │   │   ├── loyaltyController.js        # getLoyaltyStatus, claimCoupon
│   │   │   ├── limitController.js          # getLimits (fetches user wallet_limits, creates defaults if missing)
│   │   │   └── notificationController.js   # getNotifications, markAsRead, markAllAsRead, deleteNotification (plus createNotification helper)
│   │   │
│   │   ├── services/                       # Business logic layer
│   │   │   ├── emailService.js             # sendMFACode, sendTransactionAlert, sendPasswordResetEmail, sendGenericEmail; auto-uses Ethereal if no SMTP configured
│   │   │   ├── walletService.js            # deposit (with DB transaction + ledger + audit), withdraw (with fee calc + limit check + ledger + audit)
│   │   │   ├── transferService.js          # executeTransfer (full flow: lock wallets, validate balance, fee, limit, risk, update balances, ledger, loyalty points, notifications, email alert, audit)
│   │   │   ├── ledgerService.js            # double-entry accounting: recordTransaction (validates zero-sum), getOrCreateWalletAccount
│   │   │   ├── feeService.js               # calculateFee based on user tier fee_percent
│   │   │   ├── limitService.js             # getUsage (daily/monthly aggregation), checkLimit (against tier daily/monthly caps)
│   │   │   └── riskService.js              # checkVelocity (>10 tx/hr = flagged), checkAmount (>10k MAD = flagged), logRiskEvent
│   │   │
│   │   ├── repositories/                   # Data access layer (thin wrappers around db.query)
│   │   │   ├── walletRepository.js         # findByUserId (with optional FOR UPDATE lock), updateBalance
│   │   │   ├── transactionRepository.js    # create (inserts with UUID generation)
│   │   │   └── userRepository.js           # findById, updateLoyaltyPoints
│   │   │
│   │   ├── middleware/                     # Express middleware
│   │   │   ├── auth.js                     # Bearer JWT verification → db user lookup → req.user + suspension check
│   │   │   ├── admin.js                    # req.user.role === 'ROLE_ADMIN' guard
│   │   │   ├── merchant.js                 # req.user linked to merchant guard
│   │   │   ├── rateLimit.js                # apiLimiter (100/15min) + sensitiveLimiter (10/30min)
│   │   │   └── idempotency.js              # Idempotency-Key header → stores/reuses responses for sensitive ops
│   │   │
│   │   └── lib/                            # Shared utilities
│   │       ├── db.js                       # MySQL connection pool (10 connections), ensureColumn + ensureTable helpers
│   │       ├── validate.js                 # Schema-based validation (required, type, min, max, pattern, oneOf)
│   │       └── auditLogger.js              # INSERT INTO audit_logs for sensitive actions
│   │
│   ├── database/
│   │   ├── schema.sql                      # 26 CREATE TABLE statements with FKs, indexes, seed tier data
│   │   └── seed.js                         # Creates demo user (demo@marjane.ma / marjane2026) + wallet
│   │
│   ├── prisma/                          # ⚠️ DEAD CODE — declared but never used at runtime
│   │   ├── schema.prisma                   # Declares 4 models (User, Wallet, Transaction, DeviceSession)
│   │   └── seed.js                         # Prisma-based seed (redundant with database/seed.js)
│   │
│   ├── scripts/                         # 🛠️ Dev/utility scripts, not for production
│   │   ├── diag_users.js                   # Diagnostic script — user data inspection
│   │   ├── diag_users_simple.js            # Simplified diagnostic variant
│   │   ├── migrate_verification.js         # One-off migration script
│   │   └── test_resend_mfa.js              # Test script for resend MFA flow
│   │
│   └── uploads/                            # Uploaded files (gitignored content)
│       ├── kyc/                            # KYC document uploads
│       └── dispute_evidence/               # Dispute evidence uploads
│
├── frontend/                               # ---- FRONTEND (Next.js 14 + TypeScript) ----
│   ├── package.json                        # Dependencies: next, react, face-api.js, gsap, recharts, lucide-react, etc.
│   ├── next.config.js                      # Webpack config: polyfills encoding, fallbacks for node modules, alias for encoding
│   ├── tsconfig.json                       # TypeScript config: bundler module resolution, @/* → ./src/* path alias
│   ├── tailwind.config.js                  # Custom colors (marjane blue/gold), fonts (Inter, Outfit), 8 custom animations
│   ├── postcss.config.js                   # PostCSS with Tailwind + Autoprefixer
│   │
│   ├── public/                             # Static assets served at /
│   │   ├── Marjane-logo.png               # Brand logo PNG
│   │   ├── models/test.txt                # Placeholder for ML model directory
│   │   └── weights/                        # face-api.js pre-trained model weights (~7.5MB total)
│   │       ├── tiny_face_detector_model-shard1
│   │       ├── tiny_face_detector_model-weights_manifest.json
│   │       ├── face_landmark_68_model-shard1
│   │       ├── face_landmark_68_model-weights_manifest.json
│   │       ├── face_recognition_model-shard1
│   │       └── face_recognition_model-weights_manifest.json
│   │
│   ├── src/                                # ---- Frontend source code ----
│   │   ├── polyfills/
│   │   │   └── encoding.js                 # Polyfill for face-api.js (re-exports global TextEncoder/TextDecoder)
│   │   │
│   │   ├── lib/
│   │   │   └── api.ts                      # apiFetch client: Base URL http://localhost:5000/api, auto-injects JWT, silent 401 refresh with subscriber pattern, Idempotency-Key header, suspension redirect
│   │   │
│   │   ├── app/                            # Next.js App Router pages
│   │   │   ├── globals.css                 # 611 lines: CSS variables (dark theme), Tailwind layers, glass/organic utilities, 30+ keyframes, section animations
│   │   │   ├── layout.tsx                  # Root layout: Inter + Outfit fonts, ThemeProvider, ToastProvider, LoadingBar, dark class on HTML
│   │   │   ├── page.tsx                    # Homepage: Navbar → Hero → Trust Bar → Showcase → Features Grid → Onboarding → Security → Stats Bar → Testimonials → CTA → Footer → ClientAnimations
│   │   │   │
│   │   │   ├── login/page.tsx              # Login: ambient orbs, GSAP entrance, gold/ghost buttons, magnetic hover, email+password, remember-me, biometric overlay, MFA redirect
│   │   │   ├── register/page.tsx           # Registration: 2-step (info → face), ambient orbs+particles+spotlight, GSAP, PhoneInput, FaceAuth
│   │   │   ├── mfa/page.tsx                # MFA: face scan → client-side descriptor matching → 6-char code → verify-mfa; retry+skip-to-code fallback
│   │   │   ├── forgot-password/page.tsx    # Forgot password: email input → POST /auth/forgot-password → success confirmation
│   │   │   ├── reset-password/page.tsx     # Reset password: token from URL → new password + confirm → POST /auth/reset-password
│   │   │   ├── verify/page.tsx             # Email/phone verification: code input, resend, step-based, redirects to /dashboard
│   │   │   │
│   │   │   ├── dashboard/page.tsx          # Dashboard: wallet balance, recent transactions, quick action modals, virtual card, pending requests, notifications, GSAP entrance, particles
│   │   │   ├── profile/page.tsx            # Profile: edit name/phone, change password, face auth status, sessions, logout all, delete account, notification tray
│   │   │   ├── transactions/page.tsx       # Transaction history: search, filter (type/status/date), pagination, detail modal, export
│   │   │   ├── cards/page.tsx              # Virtual cards: list, create, freeze/unfreeze, delete, regenerate, refill, GSAP
│   │   │   ├── kyc/page.tsx                # KYC: 5-step wizard (Overview → Government ID → Selfie → Address → Review), document upload, status
│   │   │   ├── rewards/page.tsx            # Loyalty: points display, tier progress (Bronze/Silver/Gold), coupon redemption
│   │   │   │
│   │   │   ├── admin/                      # Admin portal (role=ROLE_ADMIN)
│   │   │   │   ├── layout.tsx              # Admin layout: sidebar (9 nav items), top header with search + notification bell + avatar
│   │   │   │   ├── page.tsx                # Admin overview: system stats, health, recent activity (polls every 30s)
│   │   │   │   ├── users/page.tsx          # User management: search, toggle suspend/activate, reset MFA
│   │   │   │   ├── transactions/page.tsx   # Transaction monitoring: search, view details, reverse
│   │   │   │   ├── merchant-requests/page.tsx  # Merchant onboarding: view, approve/reject
│   │   │   │   ├── broadcast/page.tsx      # Broadcast system: send notifications to all users
│   │   │   │   ├── audit/page.tsx          # Audit logs: search, filter by action/user/date
│   │   │   │   ├── ledger/page.tsx         # General ledger: accounts list, entries, search by account/user
│   │   │   │   ├── disputes/page.tsx       # Dispute management: view, filter, resolve with notes
│   │   │   │   └── kyc/page.tsx            # KYC reviews: list verifications, view documents, approve/reject
│   │   │   │
│   │   │   └── merchant/                   # Merchant portal (role linked to merchant)
│   │   │       ├── layout.tsx              # Merchant layout: sidebar (4 nav items), fetch name, switch to personal + sign out
│   │   │       ├── dashboard/page.tsx      # Sales dashboard: revenue chart, transactions, stats (Recharts AreaChart+BarChart)
│   │   │       ├── history/page.tsx        # Merchant transaction history with search
│   │   │       ├── onboarding/page.tsx     # Merchant onboarding form (name, description, category) → POST /merchant/onboarding
│   │   │       ├── qr/page.tsx             # Merchant QR code: generate/download/copy/share QR for payments
│   │   │       └── settlements/page.tsx    # Settlements: balance, request settlement, history
│   │   │
│   │   ├── components/                     # Reusable React components
│   │   │   ├── FaceAuth.tsx                # face-api.js: model loading, camera, 200ms detection loop, 2-frame stability, capture
│   │   │   ├── BiometricOverlay.tsx        # Full-screen biometric login overlay with face scan
│   │   │   ├── ThemeProvider.tsx           # React context dark/light theme, persisted to localStorage
│   │   │   │
│   │   │   ├── ui/                         # Shared UI components
│   │   │   │   ├── Navbar.tsx              # Fixed nav: scroll-aware, mobile menu, auth state, user dropdown
│   │   │   │   ├── Hero.tsx                # 784-line hero: cinema background, 3D card tilt, magnetic buttons, orbs, particles, GSAP
│   │   │   │   ├── Footer.tsx              # Marketing footer: brand, social, platform/company/legal links, payment logos
│   │   │   │   ├── ClientAnimations.tsx    # GSAP ScrollTrigger for all homepage sections (16+ triggers)
│   │   │   │   ├── LoadingBar.tsx          # Top-of-page route transition progress bar
│   │   │   │   ├── Toast.tsx               # Standalone toast (fixed position, glassmorphism, auto-dismiss)
│   │   │   │   ├── ToastProvider.tsx       # Context-based toast system (success/error/info/warning), stacked, max 5 visible
│   │   │   │   ├── PhoneInput.tsx          # Phone number input with country code dropdown
│   │   │   │   └── ConfirmModal.tsx        # Confirmation dialog modal
│   │   │   │
│   │   │   ├── Wallet/                     # Wallet feature components
│   │   │   │   ├── WalletCard.tsx, VirtualCard.tsx, TransferModal.tsx, DepositModal.tsx
│   │   │   │   ├── WithdrawModal.tsx, RequestModal.tsx, QRScanner.tsx, QRScannerModal.tsx
│   │   │   │   └── ReceiveModal.tsx, ConvertModal.tsx, TransactionDetailModal.tsx, SettingsPanel.tsx
│   │   │   │
│   │   │   └── Notifications/
│   │   │       └── NotificationTray.tsx    # Notification tray dropdown with list, mark read, types
│   │   │
│   │   └── app/favicon.ico                 # (in .next output, not tracked directly)
│   │
│   └── .next/                           # ⚠️ AUTO-GENERATED (gitignored) — Next.js build output
│       ├── build-manifest.json, cache/, server/, static/, types/
│       └── (app bundles, vendor chunks, compiled CSS, optimized fonts)
```

---

## 3. COMPONENT BREAKDOWN

### 3.1 Backend: Express Application

| Component | Location | Purpose | Key Files | Dependencies | Interacts With |
|-----------|----------|---------|-----------|--------------|----------------|
| **Entry Point** | `src/app.js` | Express server setup, middleware chain, route mounting | app.js | express, cors, helmet, morgan | All routes |
| **Router** | `src/routes/api.js` | 50+ route definitions with middleware | api.js | All controllers, middleware | Controllers, middleware |
| **Auth Controller** | `src/controllers/authController.js` | User registration, login, MFA, JWT, password management, face descriptor | authController.js | bcrypt, jwt, db, auditLogger, validate, riskService, emailService | Auth routes, User table, emailService |
| **Wallet Controller** | `src/controllers/walletController.js` | Get wallet, balance, deposits, withdrawals ⚠️ See §10.2: `oldWalletController` alias exists in routes — dead code | walletController.js | db, walletService, validate | Wallet routes, walletService |
| **Transaction Controller** | `src/controllers/transactionController.js` | Search users, list transactions, request/process payments, QR payments | transactionController.js | db, notificationController, auditLogger, ledgerService | Transaction routes, notifications |
| **Transfer Controller** | `src/controllers/transferController.js` | P2P money transfer (thin wrapper) | transferController.js | transferService, validate | Transfer routes, transferService |
| **Card Controller** | `src/controllers/cardController.js` | Issue, list, freeze, regenerate, refill, delete virtual cards | cardController.js | db, notificationController, auditLogger, ledgerService | Card routes, notifications |
| **Dashboard Controller** | `src/controllers/dashboardController.js` | Aggregated user dashboard stats | dashboardController.js | db | Dashboard routes |
| **Profile Controller** | `src/controllers/profileController.js` | Update profile, change password, sessions, face auth management | profileController.js | bcrypt, db, notificationController, auditLogger | Profile routes |
| **KYC Controller** | `src/controllers/kycController.js` | Multi-step KYC: document upload, submit, review, auto-verify, reset | kycController.js | db, multer, path, fs, notificationController | KYC routes, uploads/kyc/ |
| **Dispute Controller** | `src/controllers/disputeController.js` | Create dispute, messages, evidence upload, admin resolve | disputeController.js | db, multer, ledgerService, notificationController, auditLogger | Dispute routes, uploads/dispute_evidence/ |
| **Merchant Controller** | `src/controllers/merchantController.js` | Merchant stats, transactions, settlements, onboarding, QR lookup | merchantController.js | db, auditLogger, ledgerService | Merchant routes |
| **Admin Controller** | `src/controllers/adminController.js` | User management, transaction reversal, broadcast, audit logs, ledger, system overview, KYC reviews, merchant approvals | adminController.js | db, notificationController, auditLogger | Admin routes |
| **Loyalty Controller** | `src/controllers/loyaltyController.js` | Get loyalty status, claim coupons | loyaltyController.js | db | Loyalty routes |
| **Limit Controller** | `src/controllers/limitController.js` | Get/create wallet limits | limitController.js | db | Limit routes |
| **Notification Controller** | `src/controllers/notificationController.js` | List, mark read, delete notifications; createNotification helper | notificationController.js | db | Notification routes, called by other controllers |
| **Wallet Service** | `src/services/walletService.js` | Deposit/withdraw with DB transactions, ledger, fees, limits, audit | walletService.js | db, walletRepository, transactionRepository, ledgerService, feeService, limitService, auditLogger | walletController, repositories, ledgerService |
| **Transfer Service** | `src/services/transferService.js` | Full P2P transfer: lock wallets, validate, fee, limits, risk, ledger, loyalty, notifications, email | transferService.js | db, 3 repositories, limitService, ledgerService, feeService, riskService, emailService, notificationController, auditLogger | transferController, all services + repositories |
| **Ledger Service** | `src/services/ledgerService.js` | Double-entry accounting: validate zero-sum, record entries, update account balances | ledgerService.js | db | walletService, transferService |
| **Fee Service** | `src/services/feeService.js` | Calculate transaction fee based on user tier percentage | feeService.js | db | walletService, transferService |
| **Limit Service** | `src/services/limitService.js` | Calculate daily/monthly usage and check against tier limits | limitService.js | db | walletService, transferService |
| **Risk Service** | `src/services/riskService.js` | Velocity check (>10 tx/hr), large amount flagging, risk event logging | riskService.js | db | transferService |
| **Email Service** | `src/services/emailService.js` | Send MFA codes, transaction alerts, password resets via SMTP or Ethereal | emailService.js | nodemailer | authController, transferService |
| **Auth Middleware** | `src/middleware/auth.js` | JWT verification → DB lookup → req.user ⚠️ See §10.5: DB lookup per request is a performance concern | auth.js | jwt, db | All protected routes |
| **Admin Middleware** | `src/middleware/admin.js` | Role check: ROLE_ADMIN | admin.js | — | Admin routes |
| **Merchant Middleware** | `src/middleware/merchant.js` | Merchant-linked user check | merchant.js | db | Merchant routes |
| **Rate Limit** | `src/middleware/rateLimit.js` | 100 req/15min API, 10 req/30min sensitive | rateLimit.js | express-rate-limit | All routes |
| **Idempotency** | `src/middleware/idempotency.js` | Idempotency-Key dedup for sensitive POSTs | idempotency.js | db | Transfer, deposit, withdrawal routes |
| **DB Pool** | `src/lib/db.js` | MySQL2 pool (10 connections), ensureColumn/ensureTable | db.js | mysql2 | All DAL code |
| **Validator** | `src/lib/validate.js` | Schema validation: required, type, min/max, pattern, oneOf | validate.js | — | Controllers |
| **Audit Logger** | `src/lib/auditLogger.js` | INSERT INTO audit_logs for all sensitive actions | auditLogger.js | db | Controllers, services |

### 3.2 Frontend: Next.js Application

| Component | Location | Purpose | Key Files | Dependencies | Interacts With |
|-----------|----------|---------|-----------|--------------|----------------|
| **Root Layout** | `src/app/layout.tsx` | HTML shell, fonts (Inter, Outfit), ThemeProvider, ToastProvider, LoadingBar | layout.tsx | next/font, ThemeProvider, ToastProvider, LoadingBar | All pages |
| **Homepage** | `src/app/page.tsx` | Marketing landing: Navbar + Hero → Trust → Showcase → Features → Onboarding → Security → Stats → Testimonials → CTA → Footer | page.tsx | Navbar, Hero, Footer, ClientAnimations | All UI components |
| **Login Page** | `src/app/login/page.tsx` | Email/password form, remember-me, biometric overlay, MFA redirect | page.tsx | api, BiometricOverlay, Toast, gsap | Auth API, sessionStorage |
| **Register Page** | `src/app/register/page.tsx` | 2-step: info form → FaceAuth biometric capture → POST /auth/register | page.tsx | api, FaceAuth, PhoneInput, Toast, gsap | Auth API |
| **MFA Page** | `src/app/mfa/page.tsx` | Face scan → client-side matching → 6-char code → verify-mfa | page.tsx | api, FaceAuth, Toast | Auth API, sessionStorage |
| **Dashboard** | `src/app/dashboard/page.tsx` | Wallet overview, transactions, quick action modals, virtual card, notifications | page.tsx | apiFetch, 6 modals, Toast, gsap | Auth/me, transactions, cards, dashboard/stats API |
| **Profile** | `src/app/profile/page.tsx` | Edit profile, password change, sessions, face auth, notifications | page.tsx | api, NotificationTray, Toast | Profile, face-status, sessions API |
| **Transactions** | `src/app/transactions/page.tsx` | History with search, filter, pagination, detail modal | page.tsx | api, TransactionDetailModal, NotificationTray | Transactions API |
| **Cards** | `src/app/cards/page.tsx` | Virtual card management with GSAP | page.tsx | api, Toast, gsap | Cards API |
| **KYC** | `src/app/kyc/page.tsx` | 5-step KYC wizard: ID, selfie, address, review | page.tsx | api, Toast | KYC API |
| **FaceAuth** | `src/components/FaceAuth.tsx` | face-api.js model loading, camera, detection loop, descriptor capture | FaceAuth.tsx | face-api.js, lucide-react | register, mfa pages |
| **BiometricOverlay** | `src/components/BiometricOverlay.tsx` | Full-screen biometric login | BiometricOverlay.tsx | — | login page |
| **ThemeProvider** | `src/components/ThemeProvider.tsx` | Dark/light context + localStorage | ThemeProvider.tsx | react | Root layout |
| **ToastProvider** | `src/components/ui/ToastProvider.tsx` | Toast system with context | ToastProvider.tsx | lucide-react, clsx, tailwind-merge | Root layout |
| **Navbar** | `src/components/ui/Navbar.tsx` | Fixed navigation, scroll-aware, auth state | Navbar.tsx | lucide-react, next/link | Homepage |
| **Hero** | `src/components/ui/Hero.tsx` | Cinema hero with 3D card, particles, GSAP timeline (784 lines) | Hero.tsx | gsap, ScrollTrigger | Homepage |
| **ClientAnimations** | `src/components/ui/ClientAnimations.tsx` | GSAP ScrollTrigger for all page sections | ClientAnimations.tsx | gsap, ScrollTrigger | Homepage |
| **API Client** | `src/lib/api.ts` | Fetch wrapper: JWT injection, 401 refresh, idempotency keys | api.ts | — | All pages |
| **Wallet Components** | `src/components/Wallet/*.tsx` | 12 modal components for wallet operations | *.tsx | lucide-react, html5-qrcode, qrcode.react | Dashboard |
| **NotificationTray** | `src/components/Notifications/NotificationTray.tsx` | Notification dropdown | NotificationTray.tsx | lucide-react | Profile, Transactions |

### 3.3 State Management Architecture

| State Layer | Mechanism | Location | Data | Persistence |
|-------------|-----------|----------|------|-------------|
| **Auth state** | `localStorage` + manual `useEffect` | All pages | JWT token, refresh token, user role | Persisted across sessions |
| **Theme** | `ThemeProvider` React Context | `src/components/ThemeProvider.tsx` | `dark`/`light` preference | `localStorage` |
| **Toast notifications** | `ToastProvider` React Context + queue | `src/components/ui/ToastProvider.tsx` | Success/error/info/warning messages | In-memory only (max 5) |
| **Route transitions** | `LoadingBar` with start/done calls | `src/components/ui/LoadingBar.tsx` | Loading progress state | In-memory only |
| **Wallet balance** | `useState` + manual `fetch` on dashboard mount | `src/app/dashboard/page.tsx` | Balance, currency | Fetched fresh each mount (no cache) |
| **Transaction list** | `useState` + manual `fetch` with pagination | `src/app/transactions/page.tsx` | Transaction array, filters, page | Fetched fresh each mount |
| **Face descriptor (MFA)** | `sessionStorage` | `login/page.tsx` → `mfa/page.tsx` | 128-dim Float32Array as JSON | Cleared after MFA page reads |
| **Notification count** | `useState` + fetch on mount | Multiple pages | Unread count | Fetched fresh each mount |

**Key observations:**
- **No React Query / SWR** — all data fetching is manual `useEffect` + `fetch`. No caching, dedup, or stale-while-revalidate.
- **Wallet balance** is fetched on every dashboard mount — no interval refresh, no WebSocket push.
- **Notification polling** is manual — broadcast notifications require page refresh to appear.
- **Admin overview** polls `/admin/system/overview` every 30s via `setInterval` — the only polling in the app.

### 3.4 Error Handling Strategy

| Layer | Mechanism | Current State | Gap |
|-------|-----------|---------------|-----|
| **API client** (`api.ts`) | Silent 401 refresh with subscriber pattern; redirect to `/login` if refresh fails | Working for auth expiry | No global error boundary for network failures |
| **Controller validation** | `validate.js` — returns 400 with `{ error, details }` | Present but inconsistently applied | ~18 silent catch blocks in frontend |
| **Frontend `try/catch`** | `catch { }` or `catch (err) { console.error(err) }` | ~18 occurrences | No user-facing error messages — failures are silent |
| **Global error boundary** | Not implemented | None | A component crash takes down the entire page |
| **HTTP error responses** | Backend returns `{ error: string }` or `{ error, details }` | Consistent format | Some endpoints return raw MySQL errors in development |
| **Toast errors** | `ToastProvider` expected to show backend error messages | Used in login/register | Not wired in most data-fetching pages |

**Target strategy (not implemented):**
```
API layer → Global Error Boundary → Toast notification per error type
  - 401 → Silent refresh (existing) → redirect /login if fails
  - 403 → Toast "You don't have permission"
  - 404 → Toast "Resource not found"
  - 422 → Inline form validation errors
  - 500 → Toast "Something went wrong" + console.error
  - Network → Toast "Connection error" + retry UI
  - Uncaught → ErrorBoundary fallback UI (not blank page)
```

### 3.5 Code Complexity Hotspots

| File | Lines | Key Issue | Refactor Target |
|------|-------|-----------|-----------------|
| `frontend/src/components/ui/Hero.tsx` | 784 | Monolithic: cinema background, 3D card tilt, magnetic buttons, odometer, orbs, particles, spotlight, GSAP timeline + ScrollTrigger — 12+ concerns in one file | Split into `HeroBackground`, `HeroContent`, `HeroCTA` with separate GSAP timelines |
| `frontend/src/app/globals.css` | 611 | 30+ keyframes, glass/organic utilities, universal `* { transition: all 0.4s }` — large and can conflict with GSAP | Extract animations to CSS modules; remove universal transition |
| `frontend/src/lib/api.ts` | ~200 | Monolithic fetch wrapper handling JWT injection, 401 refresh subscriber pattern, idempotency keys, suspension redirect — all in one file | Split into `authTokenManager`, `apiClient`, `retryQueue` |
| `backend/src/routes/api.js` | ~500+ | 50+ route definitions in one monolithic file with inline middleware | Split into `auth.routes.js`, `wallet.routes.js`, `card.routes.js`, etc. |
| `backend/src/controllers/authController.js` | ~400 | 12+ handler functions — register, login, MFA, password reset, face descriptor, etc. | Split into `auth.controller.js` + `mfa.controller.js` + `password.controller.js` |
| `backend/src/services/transferService.js` | ~300 | Full P2P flow in one function — wallet locking, fee calc, limits, risk, ledger, notifications, email | Extract notification + email dispatch to post-commit event emitter |
| `frontend/src/app/dashboard/page.tsx` | ~500 | Page component with 12 modal imports, inline state, multiple data fetches | Split into `DashboardHeader`, `WalletOverview`, `TransactionList`, `QuickActions` |

**Highest cyclomatic complexity:** `transferService.executeTransfer()` — single function orchestrating 10+ services with DB transaction lifecycle, conditional branching for fee/limits/risk, and post-commit async dispatch.

---

## 4. ENTRY POINTS

### 4.1 Backend Entry

**`backend/src/app.js`** — Express server on port 5000:
```
npm start        # node src/app.js (production)
npm run dev      # nodemon src/app.js (development with hot reload)
```

### 4.2 Frontend Entry

**`frontend/package.json`** scripts:
```
npm run dev      # next dev — development server on port 3000
npm run build    # next build — production build
npm run start    # next start — production server on port 3000
npm run lint     # next lint — ESLint check
```

### 4.3 API Endpoints Summary

All routes are mounted under `/api`. All protected routes require `Authorization: Bearer <JWT>` header.

#### Auth (no auth required unless noted)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Create account (name, email, password, phone, faceDescriptor) |
| POST | `/auth/login` | Login with email/password; returns `requireMFA`, `faceDescriptor` |
| POST | `/auth/verify-mfa` | Verify 6-char MFA code, get JWT + refresh token |
| POST | `/auth/resend-mfa` | Resend MFA code |
| POST | `/auth/verify-token` | Verify email verification token |
| POST | `/auth/resend-verification` | Resend verification email |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/refresh` | Refresh JWT using refresh token |
| POST | `/auth/logout` | Logout (auth) |
| POST | `/auth/logout-all` | Logout all devices (auth) |
| GET | `/auth/me` | Get current user (auth) |
| GET | `/auth/user/:userId/face-descriptor` | Get stored face descriptor (no auth — intentionally open for pre-login MFA flow, but see §10.1: this exposes biometric data and needs mitigation) |

#### Wallet (auth required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/wallet` | Get wallet details |
| GET | `/wallet/balance` | Get wallet balance |
| GET | `/dashboard/stats` | Aggregated dashboard statistics |

#### Cards (auth required)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/cards/issue` | Issue new virtual card |
| GET | `/cards` | List user's cards |
| PATCH | `/cards/status` | Freeze/unfreeze card |
| POST | `/cards/:cardId/regenerate` | Regenerate card number |
| POST | `/cards/refill` | Refill card from wallet |
| DELETE | `/cards/:cardId` | Delete card |

#### Transactions (auth required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/transactions/search` | Search users by email/phone |
| POST | `/transactions/transfer` | P2P transfer (sensitive + idempotent) |
| POST | `/transactions/withdraw` | Withdraw to external (sensitive + idempotent) |
| GET | `/transactions/recent` | Recent transactions |
| GET | `/transactions/requests` | Pending money requests |
| POST | `/transactions/request` | Request money from user |
| POST | `/transactions/process-request` | Accept/reject money request |
| POST | `/transactions/qr-payment` | Process QR payment |
| GET | `/transactions/history` | Full transaction history |

#### KYC (auth required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/kyc/status` | Get KYC verification status |
| POST | `/kyc/upload` | Upload KYC document (multipart) |
| POST | `/kyc/submit` | Submit KYC verification |
| GET | `/kyc/documents` | List uploaded documents |
| POST | `/kyc/review` | Admin review KYC (admin) |
| POST | `/kyc/auto-verify` | Auto-verify KYC |
| DELETE | `/kyc/documents/:id` | Delete document |
| GET | `/kyc/documents/:id/file` | Get document file |
| POST | `/kyc/reset-status` | Reset KYC status |

#### Profile (auth required)
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/profile` | Update name/phone |
| POST | `/profile/change-password` | Change password |
| GET | `/profile/sessions` | Active sessions |
| POST | `/profile/logout-all` | Logout all devices |
| GET | `/profile/face-status` | Face auth enrollment status |
| DELETE | `/profile/face-auth` | Remove face descriptor |

#### Merchant (auth + merchant role required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/merchant/stats` | Merchant sales stats |
| GET | `/merchant/transactions` | Merchant transactions |
| GET | `/merchant/settlements` | Settlement history |
| POST | `/merchant/settlements` | Request settlement |
| POST | `/merchant/onboarding` | Request merchant onboarding (auth only) |
| GET | `/merchant/qr-lookup` | QR lookup for payment |

#### Admin (auth + admin role required)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/admin/user/suspend` | Suspend user |
| POST | `/admin/user/unsuspend` | Unsuspend user |
| GET | `/admin/users` | List all users |
| POST | `/admin/users/status` | Toggle user active/suspended |
| POST | `/admin/users/reset-mfa` | Reset user MFA |
| GET | `/admin/transactions` | List all transactions |
| POST | `/admin/transactions/reverse` | Reverse transaction |
| POST | `/admin/broadcast` | Broadcast notification |
| GET | `/admin/audit-logs` | Get audit logs |
| GET | `/admin/ledger/summary` | Ledger summary |
| GET | `/admin/ledger/entries` | Ledger entries |
| GET | `/admin/system/overview` | System stats + health |
| GET | `/admin/kyc` | List KYC verifications |
| GET | `/admin/merchant/requests` | List merchant requests |
| POST | `/admin/merchant/approve` | Approve merchant |

#### Disputes (auth required)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/disputes` | Create dispute |
| GET | `/disputes` | Get my disputes |
| GET | `/disputes/:id/messages` | Get dispute messages |
| POST | `/disputes/message` | Add message to dispute |
| POST | `/disputes/:id/evidence` | Upload evidence (multipart) |
| GET | `/disputes/:id/evidence` | List evidence |
| GET | `/disputes/:id/evidence/:eid/file` | Get evidence file |
| GET | `/admin/disputes` | Admin list all disputes |
| POST | `/admin/disputes/resolve` | Admin resolve dispute |

#### Loyalty (auth required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/loyalty/status` | Get loyalty points + tier |
| POST | `/loyalty/claim` | Claim coupon |

#### Notifications (auth required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/notifications` | Get notifications (last 50) |
| PATCH | `/notifications/read-all` | Mark all as read |
| PATCH | `/notifications/:id/read` | Mark one as read |
| DELETE | `/notifications/:id` | Delete notification |

#### Limits (auth required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/limits` | Get user wallet limits |

#### Health
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check (returns status + timestamp) |

### 4.3a API Request/Response Contracts

#### POST /api/auth/register
```json
// Request
{ "name": "John Doe", "email": "john@example.com", "password": "SecurePass1", "phone": "+212600000000", "faceDescriptor": [0.012, -0.034, ...] /* 128-dim Float32Array */ }

// Response 201
{ "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" }, "requireVerification": true }

// Response 400
{ "error": "Validation failed", "details": [{ "field": "email", "message": "Invalid email format" }] }

// Response 409
{ "error": "Email already registered" }
```

#### POST /api/auth/login
```json
// Request
{ "email": "john@example.com", "password": "SecurePass1" }

// Response 200 (MFA required)
{ "requireMFA": true, "email": "john@example.com", "userId": "uuid", "faceDescriptor": [0.012, ...] }

// Response 200 (no MFA — full auth)
{ "accessToken": "jwt...", "refreshToken": "jwt...", "role": "ROLE_USER" }

// Response 401
{ "error": "Invalid credentials" }
```

#### POST /api/auth/verify-mfa
```json
// Request
{ "userId": "uuid", "code": "ABC123", "device": "web-browser" }

// Response 200
{ "accessToken": "eyJhbG...", "refreshToken": "eyJhbG...", "role": "ROLE_USER" }

// Response 400
{ "error": "Invalid or expired MFA code" }
```

#### POST /api/transactions/transfer
```json
// Request (sensitive + idempotent — include Idempotency-Key header)
{ "receiverId": "uuid", "amount": 150.00, "currency": "MAD" }

// Response 200
{ "message": "Transfer successful", "transactionId": "uuid" }

// Response 400
{ "error": "Insufficient balance" }

// Response 422
{ "error": "Daily limit exceeded" }
```

#### POST /api/cards/issue
```json
// Request
{ "cardType": "VIRTUAL_VISA" }

// Response 201
{ "card": { "id": "uuid", "cardNumber": "4532****1234", "expiry": "12/28", "cvv": "***", "status": "ACTIVE", "balance": 0 } }

// Response 400
{ "error": "Card limit reached" }
```

#### POST /api/kyc/upload
```json
// Request (multipart/form-data)
// Fields: file (binary), type ("GOVERNMENT_ID"|"SELFIE"|"ADDRESS_PROOF"), verificationId (uuid)

// Response 200
{ "message": "Document uploaded", "documentId": "uuid" }
```

#### POST /api/admin/transactions/reverse
```json
// Request (admin + idempotent)
{ "transactionId": "uuid", "reason": "Customer reported unauthorized charge" }

// Response 200
{ "message": "Transaction reversed", "newTransactionId": "uuid" }

// Response 400
{ "error": "Transaction already reversed" }
```

### 4.4 Frontend Routes

| Route | Page | Auth Required | Layout |
|-------|------|---------------|--------|
| `/` | Homepage (marketing) | No | Root |
| `/login` | Login | No | Root |
| `/register` | Registration | No | Root |
| `/forgot-password` | Forgot password | No | Root |
| `/reset-password` | Reset password | No | Root |
| `/mfa` | Multi-factor auth | No (pre-auth) | Root |
| `/verify` | Email/phone verification | No (post-register) | Root |
| `/dashboard` | User dashboard | Yes | Root |
| `/profile` | User profile | Yes | Root |
| `/transactions` | Transaction history | Yes | Root |
| `/cards` | Virtual cards | Yes | Root |
| `/kyc` | KYC verification | Yes | Root |
| `/rewards` | Loyalty rewards | Yes | Root |
| `/test-notifications` | Notification test page | No | Root |
| `/admin` | Admin overview | Yes (ROLE_ADMIN) | Admin |
| `/admin/users` | Admin user management | Yes (ROLE_ADMIN) | Admin |
| `/admin/transactions` | Admin transaction monitoring | Yes (ROLE_ADMIN) | Admin |
| `/admin/merchant-requests` | Admin merchant approvals | Yes (ROLE_ADMIN) | Admin |
| `/admin/broadcast` | Admin broadcast | Yes (ROLE_ADMIN) | Admin |
| `/admin/audit` | Admin audit logs | Yes (ROLE_ADMIN) | Admin |
| `/admin/ledger` | Admin ledger view | Yes (ROLE_ADMIN) | Admin |
| `/admin/disputes` | Admin dispute management | Yes (ROLE_ADMIN) | Admin |
| `/admin/kyc` | Admin KYC reviews | Yes (ROLE_ADMIN) | Admin |
| `/merchant/dashboard` | Merchant sales dashboard | Yes (merchant) | Merchant |
| `/merchant/history` | Merchant transactions | Yes (merchant) | Merchant |
| `/merchant/onboarding` | Merchant signup | Yes | Root |
| `/merchant/qr` | Merchant QR code | Yes (merchant) | Merchant |
| `/merchant/settlements` | Merchant settlements | Yes (merchant) | Merchant |

---

## 5. CONFIGURATION & ENVIRONMENT

### 5.1 Environment Variables (`backend/.env`)

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `PORT` | No | 5000 | Express server port |
| `DATABASE_URL` | Yes | `mysql://root@localhost:3306/marjane_wallet` | MySQL connection string |
| `JWT_SECRET` | Yes | `change-this-to-a-random-secret...` | JWT signing secret (min 32 chars, production fail if default) |
| `JWT_REFRESH_SECRET` | Yes | `change-this-refresh-secret...` | Refresh token signing secret (min 32 chars) |
| `NODE_ENV` | No | development | Environment mode (production exits if JWT is default) |
| `SMTP_HOST` | No | smtp.ethereal.email | SMTP server for email sending |
| `SMTP_PORT` | No | 587 | SMTP port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |

### 5.2 Build Configuration

| File | Controls |
|------|----------|
| `frontend/next.config.js` | Webpack polyfills for Node modules (`fs`, `path`, `crypto`, `encoding`), alias for `encoding` polyfill |
| `frontend/tsconfig.json` | TypeScript strict mode, bundler module resolution, `@/*` → `./src/*` alias |
| `frontend/tailwind.config.js` | Custom color palette (marjane blue/gold, HSL variables), fonts (Inter, Outfit), 8 custom animations, fluid/glass utility classes |
| `frontend/postcss.config.js` | Tailwind CSS + Autoprefixer |
| `backend/.env` | Runtime environment: DB connection, JWT secrets, SMTP |

### 5.3 Database Configuration

- **Engine:** MySQL 8 (via `mysql2` npm package)
- **Connection:** Connection pool from `DATABASE_URL` with `waitForConnections: true`, `connectionLimit: 10`
- **Schema:** 26 tables (`users`, `wallets`, `transactions`, `cards`, `tiers`, `wallet_limits`, `kyc_verifications`, `kyc_documents`, `kyc_reviews`, `notifications`, `audit_logs`, `risk_events`, `ledger_accounts`, `ledger_entries`, `device_sessions`, `refresh_tokens`, `idempotency_keys`, `disputes`, `dispute_messages`, `dispute_evidence`, `merchants`, `merchant_users`, `merchant_wallets`, `merchant_settlements`, `coupons`, `user_coupons`)
- **Self-healing schema:** Backend controllers call `ensureColumn()` / `ensureTable()` at startup to add missing columns/tables dynamically
- **Prisma** schema declared (`prisma/schema.prisma`) with only 4 models (`User`, `Wallet`, `Transaction`, `DeviceSession`) but Prisma is **not used at runtime** — all access is via raw SQL

### 5.4 Third-Party Service Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **SMTP / Ethereal** | Email sending (MFA codes, alerts, password resets) | Optional — auto-creates Ethereal test account if unconfigured |
| **face-api.js** (client-side) | Face detection + recognition (TinyFaceDetector + FaceLandmark68 + FaceRecognitionNet) | Models loaded from `/public/weights/` |

### 5.5 Database Schema Relationships

| # | Table | Purpose | Key Columns | Foreign Keys | Relationships |
|---|-------|---------|-------------|--------------|--------------|
| 1 | `users` | Core user accounts | id, email, password, role, face_descriptor, mfa_code, mfa_expires | — | 1:1 → wallets, 1:N → transactions, 1:N → cards, 1:N → device_sessions |
| 2 | `tiers` | User tiers (Bronze/Silver/Gold) | id, name, daily_limit, monthly_limit, fee_percent | — | 1:N → users (via tier_id), 1:N → wallet_limits |
| 3 | `wallets` | User wallet balances | id, user_id, balance, currency, daily_sent, monthly_sent, last_reset | users.id | 1:1 ← users, 1:N → transactions |
| 4 | `transactions` | All money movements | id, sender_id, receiver_id, type, amount, fee, currency, status, reference | users.id, wallets.id | N:1 → users (sender), N:1 → users (receiver) |
| 5 | `cards` | Virtual Visa-like cards | id, user_id, card_number, expiry, cvv, status, balance | users.id | N:1 → users |
| 6 | `wallet_limits` | Per-wallet tier limits | id, user_id, tier_id, daily_limit, monthly_limit | users.id, tiers.id | 1:1 ← users, N:1 → tiers |
| 7 | `kyc_verifications` | KYC status tracking | id, user_id, status, type, reviewed_by, reviewed_at | users.id | 1:1 ← users |
| 8 | `kyc_documents` | Uploaded KYC documents | id, user_id, verification_id, type, file_path, status | users.id, kyc_verifications.id | N:1 → kyc_verifications |
| 9 | `kyc_reviews` | Admin KYC review trail | id, verification_id, reviewer_id, decision, notes | kyc_verifications.id, users.id | N:1 → kyc_verifications |
| 10 | `notifications` | User notifications | id, user_id, type, title, message, read | users.id | N:1 → users |
| 11 | `audit_logs` | Sensitive action audit trail | id, user_id, action, details, ip_address | users.id | N:1 → users |
| 12 | `risk_events` | Fraud/risk flags | id, user_id, event_type, details, severity | users.id | N:1 → users |
| 13 | `ledger_accounts` | Double-entry accounting accounts | id, account_name, account_type, balance | — | 1:N → ledger_entries |
| 14 | `ledger_entries` | Individual journal entries | id, ledger_account_id, transaction_id, debit, credit | ledger_accounts.id, transactions.id | N:1 → ledger_accounts, N:1 → transactions |
| 15 | `device_sessions` | Active login sessions | id, user_id, device, ip, last_active | users.id | N:1 → users |
| 16 | `refresh_tokens` | JWT refresh token store | id, user_id, token, expires | users.id | N:1 → users |
| 17 | `idempotency_keys` | Idempotency dedup store | id, key, response, expires | — | — |
| 18 | `disputes` | Transaction disputes | id, user_id, transaction_id, reason, status | users.id, transactions.id | N:1 → users, N:1 → transactions |
| 19 | `dispute_messages` | Dispute conversation | id, dispute_id, sender_id, message | disputes.id, users.id | N:1 → disputes |
| 20 | `dispute_evidence` | Dispute evidence files | id, dispute_id, file_path, uploaded_by | disputes.id, users.id | N:1 → disputes |
| 21 | `merchants` | Merchant entities | id, name, description, category, status | — | 1:N → merchant_users |
| 22 | `merchant_users` | User-to-merchant mapping | id, merchant_id, user_id | merchants.id, users.id | N:1 → merchants, N:1 → users |
| 23 | `merchant_wallets` | Merchant settlement wallets | id, merchant_id, balance | merchants.id | 1:1 ← merchants |
| 24 | `merchant_settlements` | Merchant settlement requests | id, merchant_id, amount, status | merchants.id | N:1 → merchants |
| 25 | `coupons` | Loyalty reward coupons | id, name, points_required, value, stock | — | 1:N → user_coupons |
| 26 | `user_coupons` | Claimed coupons | id, user_id, coupon_id, claimed_at | users.id, coupons.id | N:1 → users, N:1 → coupons |

**Key Relationships:**
- `users` 1:1 `wallets`, 1:1 `kyc_verifications`, 1:1 `wallet_limits`
- `users` 1:N `transactions`, `cards`, `notifications`, `device_sessions`, `refresh_tokens`, `disputes`, `audit_logs`, `risk_events`
- `transactions` 1:N `ledger_entries`, 1:N `disputes`
- `ledger_accounts` 1:N `ledger_entries`
- `merchants` 1:N `merchant_users`, 1:1 `merchant_wallets`, 1:N `merchant_settlements`
- `coupons` 1:N `user_coupons`

---

## 6. DATA FLOW

### 6.1 Registration Flow
```
User → [/register] → Form (name, email, password, phone) → FaceAuth (capture descriptor)
     → POST /api/auth/register { ... faceDescriptor }
     → authController.register
       → validate() input
       → bcrypt.hash(password)
       → db.query INSERT users
       → db.query INSERT wallets
       → emailService.sendMFACode() [simulated]
       → Response { user, requireVerification: true }
     → redirect /verify?userId=X&step=email
```

### 6.2 Login → MFA → Dashboard Flow
```
User → [/login] → POST /api/auth/login { email, password }
     → authController.login
       → bcrypt.compare password
       → generateCode() (6-char alphanumeric MFA)
       → db.query UPDATE users SET mfa_code, mfa_expires
       → emailService.sendMFACode(email, code)
       → Response { requireMFA: true, email, userId, faceDescriptor }
     → sessionStorage.setItem('mfa_faceDescriptor', descriptor)
     → redirect /mfa?email=X&userId=Y
     → [MFA page]
       → FaceAuth loads models → camera → captures face descriptor
       → Client-side matching: Euclidean distance (< 1.2) OR cosine similarity (> 0.5)
       → If match → show 6-char code input
       → POST /api/auth/verify-mfa { userId, code, device }
         → authController.verifyMFA
           → Check code (case-insensitive) + expiry
           → db.query UPDATE users SET mfa_code=NULL, mfa_expires=NULL
           → jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '15m' })
           → jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: '30d' })
           → logAudit('LOGIN_SUCCESS')
           → Response { accessToken, refreshToken, role }
         → localStorage.setItem('token', accessToken)
         → redirect /dashboard (or /admin if ROLE_ADMIN)
```

### 6.3 P2P Transfer Flow (most complex)
```
User → POST /api/transactions/transfer { receiverId, amount, currency }
     → [rateLimit: sensitiveLimiter] → [idempotency check] → [auth middleware: JWT → DB lookup]
     → transferController.handleTransfer
       → validate({ receiverId, amount })
       → transferService.executeTransfer(senderId, receiverId, amount, currency, req)
         → db.getConnection() → beginTransaction()
         → walletRepository.findByUserId(sender, conn, FOR UPDATE) → lock
         → walletRepository.findByUserId(receiver, conn, FOR UPDATE) → lock
         → feeService.calculateFee(senderId, amount, 'P2P_TRANSFER')
           → db.query JOIN users+tiers → fee_percent → amount * percent / 100
         → totalDebit = amount + fee
         → riskService.checkVelocity(senderId)
           → Count transactions in last hour, flag if > 10
         → riskService.checkAmount(senderId, amount)
           → Log risk event if > 10,000 MAD
         → limitService.checkLimit(senderId, 'transfer', totalDebit)
           → get daily/monthly usage → compare to tier limits
         → walletRepository.updateBalance(sender, -totalDebit)
         → walletRepository.updateBalance(receiver, +amount)
         → transactionRepository.create({ ... })
         → ledgerService.recordTransaction(conn, txId, [
             { senderWallet: -(amount+fee) },
             { receiverWallet: +amount },
             { system-fees-account: +fee }
           ])
           → Verify zero-sum balance
           → INSERT ledger_entries
           → UPDATE ledger_accounts SET balance += amount
         → userRepository.updateLoyaltyPoints(sender, floor(amount/100))
         → connection.commit()
         → [Post-commit async]:
           → notificationController.createNotification(sender, 'PAYMENT', ...)
           → notificationController.createNotification(receiver, 'PAYMENT', ...)
           → emailService.sendTransactionAlert(sender.email, ...)
           → logAudit(req, 'WALLET_TRANSFER')
         → Response { message, transactionId }
```

### 6.4 Face Authentication Flow (client-side)
```
Registration:
  FaceAuth (mode=register)
    → Dynamic import face-api.js
    → Load models from /weights (TinyFaceDetector + FaceLandmark68 + FaceRecognitionNet)
    → User clicks "Start Face Scan" → getUserMedia() → video feed
    → Detection loop (200ms interval): detectSingleFace → withFaceLandmarks → withFaceDescriptor
    → User clicks "Capture Biometric Data"
    → stopCamera()
    → onCapture(Array.from(128-dim Float32Array descriptor))
    → Descriptor stored in component state, sent to backend on form submit
    → Backend stores as JSON in users.face_descriptor column

Login (MFA):
  FaceAuth (mode=login)
    → Same model loading, camera, detection
    → 2 consecutive detections required (stability check)
    → onCapture(descriptor) called to MFA page
    → MFA page computes Euclidean distance to stored descriptor
    → MFA page computes Cosine similarity to stored descriptor
    → If distance < 1.2 OR similarity > 0.5 → match → proceed to code step
    → If not → show error + "Try Again" button + "Use Email Code" fallback
```

### 6.5 JWT Authentication Flow
```
[Register/Login]
    ↓
POST /api/auth/login { email, password }
    ↓
authController.login
    → bcrypt.compare password
    → If fail → 401 "Invalid credentials"
    → If success:
      → generateCode() (6-char MFA code)
      → db.query UPDATE users SET mfa_code, mfa_expires
      → emailService.sendMFACode(email, code) [simulated]
      → Response { requireMFA: true, email, userId, faceDescriptor }
    ↓
[MFA verification]
    ↓
POST /api/auth/verify-mfa { userId, code, device }
    ↓
authController.verifyMFA
    → Case-insensitive code match + expiry check
    → If fail → 400 "Invalid or expired MFA code"
    → If success:
      → Clear mfa_code, mfa_expires in DB
      → jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '15m' })  ← ACCESS TOKEN
      → jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: '30d' }) ← REFRESH TOKEN
      → logAudit('LOGIN_SUCCESS')
      → Response { accessToken, refreshToken, role }
    ↓
[Client stores tokens]
    → localStorage.setItem('token', accessToken)
    → localStorage.setItem('refreshToken', refreshToken)
    ↓
[Subsequent requests]
    → apiFetch() reads localStorage token
    → Sets Authorization: Bearer <token> header
    ↓
[auth middleware on every protected route]
    → jwt.verify(token, JWT_SECRET)
    → db.query SELECT * FROM users WHERE id = ?  ← PERFORMANCE CONCERN (§10.5)
    → Suspension check on req.user
    ↓
[Token expiry: 15 min]
    ↓
[401 response → silent refresh]
    → apiFetch subscriber pattern:
      → Queue the failed request
      → POST /api/auth/refresh { refreshToken }
      → If success → new accessToken → retry queued requests
      → If fail → clear tokens → redirect /login
    ↓
[Logout]
    → POST /api/auth/logout (with token)
    → Clear localStorage tokens
    → redirect /login
```

---

## 7. EXTERNAL DEPENDENCIES

### 7.1 Backend (`backend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | Web framework |
| `cors` | ^2.8.5 | CORS middleware |
| `helmet` | ^7.1.0 | Security headers |
| `morgan` | ^1.10.0 | HTTP request logging |
| `mysql2` | ^3.7.0 | MySQL database driver |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `jsonwebtoken` | ^9.0.3 | JWT creation and verification |
| `dotenv` | ^16.3.1 | Environment variable loading |
| `express-rate-limit` | ^8.5.2 | Rate limiting middleware |
| `multer` | ^2.1.1 | File upload handling |
| `nodemailer` | ^8.0.7 | Email sending |
| `uuid` | ^9.0.1 | UUID generation |
| `nodemon` (dev) | ^3.0.2 | Development auto-restart |

### 7.2 Frontend (`frontend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.1.0 | React framework with App Router |
| `react` | ^18 | UI library |
| `react-dom` | ^18 | React DOM renderer |
| `typescript` | ^5 | TypeScript compiler |
| `tailwindcss` | ^3.3.0 | Utility-first CSS framework |
| `autoprefixer` | ^10.4.27 | CSS vendor prefixes |
| `postcss` | ^8 | CSS post-processor |
| `clsx` | ^2.1.1 | Conditional class names |
| `tailwind-merge` | ^2.2.1 | Tailwind class conflict resolution |
| `lucide-react` | ^0.332.0 | Icon library |
| `gsap` | ^3.15.0 | Animation library (GSAP + ScrollTrigger) |
| `face-api.js` | ^0.22.2 | Face detection + recognition (client-side) |
| `html5-qrcode` | ^2.3.8 | QR code scanning |
| `qrcode.react` | ^4.2.0 | QR code generation (React component) |
| `recharts` | ^3.8.1 | Charting library (merchant dashboard) |
| `encoding` | ^0.1.13 | Encoding polyfill (face-api.js compatibility) |
| `@types/node` (dev) | ^20 | Node.js TypeScript types |
| `@types/react` (dev) | ^18 | React TypeScript types |
| `@types/react-dom` (dev) | ^18 | ReactDOM TypeScript types |
| `eslint` (dev) | ^8 | JavaScript linter |
| `eslint-config-next` (dev) | 14.1.0 | Next.js ESLint config |

### 7.3 Required System Tools

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Node.js | 18+ | Runtime for both frontend and backend |
| npm | 9+ | Package management |
| MySQL | 8.0+ | Database |
| Git | Any | Version control |

---

## 8. BUILD & DEPLOYMENT

### 8.1 Local Development Setup

```bash
# 1. Prerequisites: Node.js 18+, MySQL 8+, npm 9+

# 2. Clone and install backend
cd backend
npm install
# Edit .env with your database credentials
# Ensure MySQL is running and create the database:
mysql -u root -e "CREATE DATABASE IF NOT EXISTS marjane_wallet;"
# Run schema:
mysql -u root marjane_wallet < database/schema.sql
# Optional: seed demo account
node database/seed.js

# 3. Start backend
npm run dev    # nodemon on port 5000

# 4. Install and start frontend (in a new terminal)
cd frontend
npm install
npm run dev    # Next.js on port 3000

# 5. Open http://localhost:3000
# Demo account: demo@marjane.ma / marjane2026
# MFA code (when prompted): 123456
# Admin: Create a user with role ROLE_ADMIN in DB
```

### 8.2 Build Commands

```bash
# Backend
cd backend
npm start              # Production: node src/app.js
npm run dev            # Development: nodemon src/app.js

# Frontend
cd frontend
npm run dev            # Development: next dev (port 3000)
npm run build          # Production build: next build
npm run start          # Production serve: next start (port 3000)
npm run lint           # Lint: next lint
```

### 8.3 Deployment Notes

- **Not production-ready** (per audit: no HTTPS, no Docker, no nginx, no PM2, no secrets management)
- Backend requires MySQL 8 with `marjane_wallet` database
- Frontend builds static output via `next build` + `next start`
- JWT secrets must be changed in production (app exits with FATAL if default `change-this` prefix)
- CORS is wide open (`cors()` with no options) — configure for production
- No compression middleware configured
- No request body size limiter
- KYC upload directory is publicly accessible — must be secured
- Face descriptor endpoint `/auth/user/:userId/face-descriptor` has no auth middleware — exposed
- Database connection pool hardcoded to 10 connections — adjust for production load
- All emails are simulated via Ethereal or console when SMTP is unconfigured

### 8.4 Target Production Architecture (Vision)

```
                          ┌─────────────────────────────┐
                          │       Cloudflare DNS         │
                          └─────────────┬───────────────┘
                                        │
                          ┌─────────────▼───────────────┐
                          │   nginx reverse proxy        │
                          │   TLS termination (LetsEncrypt)│
                          │   Static file serving         │
                          │   Rate limiting               │
                          └──┬──────────────┬───────────┘
                             │              │
              ┌──────────────▼──┐     ┌────▼──────────────┐
              │ Next.js (SSR)   │     │ Express API        │
              │ Port 3000       │     │ Port 5000          │
              │ Vercel / EC2    │     │ EC2 / Docker       │
              │ Standalone mode │     │ PM2 cluster (4)    │
              └──────┬─────────┘     └──┬────────────────┘
                     │                  │
                     │         ┌────────▼────────┐
                     │         │  MySQL 8 RDS    │
                     │         │  Multi-AZ       │
                     │         │  Read replica   │
                     │         └─────────────────┘
                     │
              ┌──────▼─────────┐
              │ Redis (future)  │
              │ Cache / Session │
              │ Rate limit store│
              └────────────────┘
```

**Gap analysis (current vs. target):**

| Component | Current | Target | Blocked By |
|-----------|---------|--------|------------|
| Reverse proxy | None (Express serves directly) | nginx with TLS | Time, server setup |
| Containerization | None | Docker + docker-compose | Dockerfile creation |
| Process manager | None (bare `node`) | PM2 with 4 instances | Config file |
| Database | Single MySQL on localhost | RDS Multi-AZ + read replica | AWS account, migration |
| Cache | None | Redis | Implementation |
| CDN | None | Cloudflare/CloudFront | DNS config |
| Monitoring | `console.log` | Sentry + Winston | Setup time |

---

## 9. TESTING STRUCTURE

**Status: No test framework is configured or present in either backend or frontend.**

| Area | What's Missing |
|------|---------------|
| **Backend tests** | No `jest`, `mocha`, `ava`, or any test framework. No `__tests__` directory. No test files in `src/`. |
| **Frontend tests** | No `jest`, `vitest`, `react-testing-library`, or `cypress`. No `__tests__` directory. |
| **CI/CD** | No GitHub Actions, no test pipeline, no lint checks on CI |
| **Test scripts** | No `test` script in either `package.json` |
| **Manual tests** | `backend/scripts/test_resend_mfa.js` — standalone script that tests the resendMFA controller function |

### 9.1 Planned Test Coverage

| Layer | Framework | Target Coverage | Priority | Notes |
|-------|-----------|-----------------|----------|-------|
| **Backend API** | Jest + Supertest | 70% | P1 | Integration tests for all routes; mock DB via `mysql2` connection wrapper |
| **Auth flows** | Jest | 100% | P0 | Register, login, MFA verify/resend, token refresh, logout — security-critical |
| **Transfer service** | Jest | 100% | P1 | `executeTransfer` with mocked repositories — fee calc, limits, risk, ledger validation |
| **Frontend components** | React Testing Library | 50% | P2 | Core UI: FaceAuth, PhoneInput, Toast, modals |
| **E2E critical paths** | Playwright | Login→Transfer→Logout | P1 | Full user journey: register → verify → login → transfer → view history |
| **Face auth flow** | Playwright + face-api.js stubs | MFA path | P2 | Stub face-api.js to test match/mismatch UI paths |
| **Admin flows** | Playwright | Critical paths | P2 | User management, KYC review, transaction reversal |

**Implementation order:**
```
Phase 1 (P0): Auth flows — bcrypt, JWT, MFA code, refresh rotation
Phase 2 (P1): Transfer service — fee, limit, risk, ledger double-entry
Phase 3 (P1): Backend API integration — every route, every status code
Phase 4 (P1): E2E login→transfer→logout via Playwright
Phase 5 (P2): Frontend components + admin flows
```

---

## 10. KNOWN ISSUES / TODOs

### 10.1 Security (Critical)

| Issue | Location | Description |
|-------|----------|-------------|
| **No HTTPS** | Backend | All traffic in plaintext. No TLS anywhere. |
| **KYC files publicly accessible** | `backend/uploads/kyc/` | No auth middleware on file serving; KYC documents (IDs, selfies) are accessible if path is known |
| **Face descriptor endpoint open** | `GET /auth/user/:userId/face-descriptor` | No auth middleware — anyone can fetch any user's face biometric template |
| **CVV stored in plaintext** | `cards` table | CVV is generated and stored as plaintext VARCHAR in MySQL |
| **MFA codes logged to console** | `authController.js` | MFA codes printed in server logs |
| **CORS wide open** | `app.js` | `cors()` with no options allows all origins |
| **No request body size limiter** | `app.js` | No `express.json({ limit: '...' })` — memory exhaustion risk |
| **No CSRF protection** | Entire app | No CSRF tokens on state-changing requests |
| **JWT secret validated only in production** | `app.js` | Development mode allows `change-this` prefix, creating risk in staging |

### 10.2 Architecture & Code Quality

| Issue | Location | Description |
|-------|----------|-------------|
| **Hardcoded API URL** | `frontend/src/lib/api.ts` | `BASE_URL = 'http://localhost:5000/api'` — must change per environment |
| **Prisma dead code** | `backend/prisma/` | Prisma is installed, schema declared, and seed exists — but no runtime code uses it (all queries via raw SQL) |
| **walletController alias** | `backend/src/routes/api.js` | `const oldWalletController = require('../controllers/walletController')` — unused duplicate reference |
| **43 raw `apiFetch` calls** | Frontend pages | Bypassing the `api` object (`api.get`, `api.post`) and calling `apiFetch` directly with hardcoded endpoints |
| **28+ `as any` type assertions** | Frontend (`transactions/page.tsx`, `dashboard/page.tsx`, etc.) | TypeScript `any` casts bypass type safety |
| **18 silent catch blocks** | Frontend | `catch { }` or `catch (err) { console.error(err) }` with no user-facing error handling |
| **Circular dependency** | `transferService.js` ↔ `notificationController.js` | Service imports controller; controller imports service |
| **No schema versioning** | `db.js` | Self-healing `ensureColumn`/`ensureTable` is fragile — no migration chain, no rollback |
| **`cn()` utility duplicated** | Multiple frontend pages | At least 4 different implementations of the `cn()` function exist across pages |
| **Dead code: walletController.handleWithdraw** | `routes/api.js` | Route points to `walletController.handleWithdraw` but actual withdrawal logic is in `walletService.withdraw()` — controller method may not exist |

### 10.3 Broken Features

| Issue | Location | Description |
|-------|----------|-------------|
| **QR Scan & Pay 404** | `frontend/src/components/Wallet/QRScanner.tsx` | QR payment URL mismatch between frontend (sends to wrong endpoint) and backend expects different format |
| **Merchant Transactions nav broken** | `frontend/src/app/merchant/` | Sidebar links to `/merchant/transactions` but the actual page is at `/merchant/history` |
| **Forgot password link does nothing** | `/login` page | "Recover Access" and "Forgot Password?" links point to `/forgot-password` which submits but backend endpoint may not work without SMTP |
| **Email never sent (SMTP unconfigured)** | `backend/.env` | All SMTP variables are commented out; emails are console-logged only |
| **Resend code button does nothing** | `/verify` page | Resend handler is defined but backend endpoint behavior is untested |
| **Test-notifications page accessible** | `/test-notifications` | Development/test page is routed and accessible in production |
| **Face matching unrealistic** | `FaceAuth.tsx` + `mfa/page.tsx` | 128-dim face descriptors vary significantly between captures (lighting, angle, expression); thresholds had to be lenient (Euclidean < 1.2, cosine > 0.5), reducing security value |

### 10.4 Incomplete Features

| Feature | What's Missing |
|---------|----------------|
| **Loyalty / Rewards** | Backend endpoints exist (`/loyalty/status`, `/loyalty/claim`), coupons table seeded, but: no frontend for coupon redemption flow, no loyalty points accumulation visible in dashboard, no tier upgrade UX |
| **Dispute evidence** | Backend supports evidence file upload + listing + download, but admin dispute page has no evidence viewer UI |
| **Dispute messaging** | Backend supports messages + admin replies, but no real-time messaging UI exists |
| **KYC admin review** | Admin KYC page exists but `POST /kyc/review` may lack full frontend wiring; auto-verify endpoint missing admin middleware |
| **Admin ledger** | Ledger page is read-only — no journal entry creation, no drill-down to original transaction |
| **Broadcast notifications** | Admin broadcast page sends but users have no real-time notification (no WebSocket/polling); refresh required |
| **Merchant settlement history** | Backend stores settlement requests but merchant UI shows only current balance |
| **Password recovery** | Backend has `forgotPassword` + `resetPassword` endpoints, but: no SMTP means reset emails never send, reset flow end-to-end untested |
| **Face auth: register mode skip** | Registration FaceAuth step allows "Skip for now" which passes `null` — backend stores null descriptor, login MFA then falls back to code-only |
| **Biometric sign-in button** | Login page has "Biometric Sign In" ghost button wired to `BiometricOverlay` — overlay component may not be fully functional for face-based login (separate from MFA face flow) |
| **Admin: suspend/unsuspend** | `POST /admin/user/suspend` and `/admin/user/unsuspend` are defined in routes but frontend users page uses `POST /admin/users/status` instead — two parallel paths, may conflict |

### 10.5 Performance & UX

| Issue | Description |
|-------|-------------|
| **No caching layer** | Every request hits MySQL directly; no Redis, no in-memory cache, no HTTP caching headers |
| **Auth middleware queries DB per request** | Every authenticated request does `SELECT ... FROM users WHERE id = ?` — no JWT-only verification option |
| **No React Query / SWR** | All data fetching is manual `useEffect` + `fetch` — no caching, dedup, or stale-while-revalidate |
| **No loading skeletons** | Most pages use simple spinners instead of skeleton placeholders |
| **No error boundaries** | React error boundaries not implemented anywhere — a crash in one component brings down the entire page |
| **No empty states** | Transaction list, notifications, cards — none show empty-state illustrations when data is absent |
| **face-api.js model loading** | 7.5MB of model weights loaded on every MFA/register page visit; no persistent cache beyond browser HTTP cache |
| **Global `* { transition: all 0.4s }`** | `globals.css` applies universal transitions — can conflict with GSAP animations and cause layout jank |

### 10.6 Missing Production Infrastructure

| Missing Item | Impact |
|--------------|--------|
| Docker / docker-compose | No containerization for reproducible deployments |
| nginx / reverse proxy | No TLS termination, no load balancing, no static file serving optimization |
| PM2 / process manager | No process supervision, auto-restart, or clustering |
| Health check endpoints | Only basic `GET /api/health` — no deep health check (DB connectivity, model loaded, etc.) |
| Structured logging | No Winston/Pino — all logging is `console.log` / `console.error` |
| Monitoring / APM | No Sentry, Datadog, New Relic, or similar |
| CI/CD pipeline | No GitHub Actions, no automated testing, no deployment automation |
| Database migrations | No Alembic/Knex/Prisma Migrate — schema changes are applied ad-hoc via `ensureColumn` |

### 10.7 TODOs in Codebase

- `docs/INFO_AI.md` lines 439: extensive prioritized fix recommendations
- `docs/AUDIT.md`: 14 critical/medium/low security findings with fix orders
- `docs/AUDIT_FUNCTIONAL.md`: 30-step build order over 4 days (~48 hours) to reach 97/100 functional score
- Multiple controllers call `fixXSchema()` at module load (self-healing schema) — not a TODO per se, but indicates schema wasn't finalized before development
- No README.md exists anywhere in the project

---

## 11. SECURITY HARDENING ROADMAP

| Priority | Issue | Location | Fix | Effort | Status |
|----------|-------|----------|-----|--------|--------|
| **P0** | KYC files publicly accessible | `backend/uploads/kyc/` | Add auth middleware to static file serving or move uploads outside web root | 2h | Not started |
| **P0** | Face descriptor endpoint open | `GET /auth/user/:userId/face-descriptor` | Move to authenticated endpoint + session-scoped token for pre-login MFA | 4h | Not started |
| **P0** | CVV stored in plaintext | `cards` table | Use AES-256 encryption at rest (e.g., `crypto.createCipheriv`); decrypt only during card display | 3h | Not started |
| **P0** | MFA codes in console logs | `authController.js` | Remove `console.log` of MFA codes; use structured logging with redaction | 30min | Not started |
| **P1** | No HTTPS | Backend/Frontend | Add nginx reverse proxy with Let's Encrypt TLS (production); enforce HTTPS headers | 4h | Not started |
| **P1** | CORS wide open | `app.js` | Configure `cors({ origin: [process.env.FRONTEND_URL], credentials: true })` | 30min | Not started |
| **P2** | Auth middleware DB per request | `middleware/auth.js` | Add JWT-only verification option: embed user role/status in JWT claims, skip DB lookup for read-heavy endpoints | 3h | Not started |
| **P2** | No request body size limit | `app.js` | Add `express.json({ limit: '1mb' })` | 5min | Not started |
| **P2** | No CSRF protection | Entire app | Add `csrf` or `csurf` middleware for cookie-based sessions; for JWT-in-header, CSRF is less critical | 2h | Not started |
| **P2** | JWT secret default allowed in dev | `app.js` | Warn in dev but enforce rejection; add `git-secret` or `.env.example` without defaults | 30min | Not started |
| **P3** | No rate limit on auth routes | `rateLimit.js` | Add per-IP rate limiting for login/register (e.g., 5 attempts/min) | 1h | Not started |
| **P3** | No input sanitization | All controllers | Add `xss` or `dompurify` for user-supplied text fields (name, dispute messages) | 2h | Not started |

**Quick wins (can be done in <1 day total):**
1. Remove `console.log` of MFA codes
2. Restrict CORS to frontend origin
3. Add body size limiter
4. Enforce JWT secret rejection in all environments
5. Rate limit auth routes
6. Add auth middleware to KYC file serving
