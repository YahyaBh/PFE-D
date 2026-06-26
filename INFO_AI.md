# Marjane Wallet — Technical Audit Report

## Project Overview

Marjane Wallet is a Moroccan-focused digital wallet fintech platform. Backend is Node.js/Express with MySQL, frontend is Next.js 14 (App Router) with Tailwind CSS. The system handles user wallets (MAD/USD/EUR), P2P transfers, QR payments, virtual cards, KYC, loyalty rewards, merchant settlements, and admin controls.

---

## 1. Project Structure

```
PFE-D/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express entry point
│   │   ├── config/
│   │   │   └── db.js                 # MySQL pool + auto-healing schema
│   │   ├── controllers/             # Route handlers (10 controllers)
│   │   ├── middleware/               # auth, admin, merchant, idempotency, rateLimit, upload
│   │   ├── services/                # Business logic (wallet, transfer, ledger, risk, notification, loyalty, reward)
│   │   ├── lib/                     # Utilities (validate, auditLogger, sendEmail)
│   │   └── routes/api.js            # All route definitions
│   └── uploads/kyc/                 # KYC document storage (inside source tree)
├── frontend/
│   ├── src/
│   │   ├── app/                     # Pages (dashboard, transactions, profile, admin, login, register, rewards, kyc, etc.)
│   │   ├── components/
│   │   │   ├── Wallet/              # Modals (Transfer, Deposit, Withdraw, Request, QRScanner, TransactionDetail)
│   │   │   ├── Notifications/       # NotificationTray
│   │   │   └── ui/                  # Navbar, Hero, Footer, FeatureGrid, Toast, PhoneInput, LoadingBar
│   │   └── lib/
│   │       └── api.ts               # API client (token management, idempotency keys)
│   └── public/                      # Static assets
├── package.json                     # Root package.json (appears minimal/unused)
└── INFO_AI.md                       # This file
```

---

## 2. Architecture & Design Patterns

### ✅ Strengths
- **Double-entry ledger**: `ledgerService.js` enforces balanced (sum-to-zero) debit/credit entries with currency validation. All financial operations (deposit, transfer, withdrawal, fee, settlement) pass through it.
- **Idempotency middleware**: Prevents duplicate financial operations. Intercepts `res.json` on 2xx/4xx responses and caches the result keyed by `Idempotency-Key` header.
- **Self-healing schema**: `db.js`'s `ensureTable`/`ensureColumn` functions dynamically create tables and add missing columns at startup — no migration tool needed.
- **Repository pattern**: Controllers delegate to services (walletService, transferService, etc.) which handle business logic and DB operations.
- **JWT token pair**: Access token + refresh token with automatic refresh on 401. Refresh queue prevents concurrent refresh storms.
- **Rate limiting**: Global `apiLimiter` on all routes + `sensitiveLimiter` on transfer/withdraw/deposit endpoints.

### ⚠️ Issues

| Severity | Issue | Impact | Solution | Effort |
|----------|-------|--------|----------|--------|
| **CRITICAL** | No HTTPS enforcement (`app.js` uses `app.listen()` with plain HTTP) | All traffic sent in cleartext — credentials, tokens, KYC documents, financial data | Add `https.createServer()` or terminate TLS at reverse proxy; redirect HTTP → HTTPS | 1h |
| **HIGH** | `uploads/kyc/` is served from inside the backend source tree and accessible via Express static | KYC document images are publicly accessible without auth | Move uploads outside source tree; serve via protected route with auth middleware; use cloud storage (S3/Cloudinary) | 4h |
| **HIGH** | JWT secret validated only once at startup with a `console.warn`; no runtime enforcement | If env variable is accidentally unset or empty, the app starts with a weak/undefined secret | Add strict runtime validation with `process.exit(1)` on missing secret | 30min |
| **HIGH** | `MySQL pool` hardcoded to 10 max connections | Under load, DB connections will exhaust causing cascading failures | Make pool config via env, add connection retry, monitor pool usage | 1h |
| **HIGH** | KYC auto-verify route (`POST /kyc/auto-verify`) has no admin middleware | Any authenticated user can call self-verification bypass | Add `admin` middleware to the route | 15min |
| **MEDIUM** | `transferService.js` line 35-41 uses `Math.floor` instead of `Math.round` for fee calculation | Potential off-by-one cent errors on large volumes | Use `Math.round` or arbitrary-precision (`decimal.js`) | 15min |
| **MEDIUM** | CORS is wide open (`cors()` with no origin restrictions) | Any website can make authenticated requests if user has a valid session | Restrict to specific origins | 30min |
| **MEDIUM** | No request body size limiter | Users can upload arbitrarily large payloads, potential DoS vector | Add `express.json({ limit: '10mb' })` | 5min |
| **MEDIUM** | No compression middleware (no `compression` package) | Larger payload sizes over network, slower page loads | Add `compression` middleware | 5min |
| **LOW** | `auditLogger.js` catches errors silently — audit failures are not surfaced | If audit DB insert fails, the operation still succeeds without trace | Consider fire-and-forget queue or at least log to a fallback | 2h |
| **LOW** | `validate.js` custom validation is very basic (no nested validation, no sanitization) | Could miss complex validation rules | Consider using `joi` or `zod` for robust validation | 4h |

---

## 3. Database

### Schema (self-healing — created dynamically)
- **Tables**: `users`, `wallets`, `transactions`, `ledger_entries`, `cards`, `notifications`, `kyc_documents`, `disputes`, `sessions`, `merchants`, `settlements`, `coupons`, `user_coupons`, `loyalty_points`, `audit_logs`, `idempotency_cache`, `limits`
- **Migration system**: None — relies entirely on runtime `ensureTable`/`ensureColumn` calls in `db.js`
  - ✅ Pro: No migration scripts to maintain, auto-creates missing columns
  - ❌ Con: No rollback, no versioning, schema changes are implicit and irreversible
- **Connection pool**: `mysql2/promise` with `connectionLimit: 10` (hardcoded)

### Issues
| Severity | Issue | Impact | Solution | Effort |
|----------|-------|--------|----------|--------|
| **HIGH** | `Math.floor()` used in fee calculations | Precision loss on financial calculations | Use `decimal.js` or MySQL `DECIMAL` with exact arithmetic | 2h |
| **MEDIUM** | No schema versioning | Cannot track or roll back schema changes; different environments may diverge | Add a `schema_version` table and migration scripts | 4h |
| **LOW** | `audit_logs.old_value`/`new_value` stored as `JSON.stringify` strings | Cannot query inside JSON values in older MySQL | Use `JSON` column type if using MySQL 5.7+ | 1h |

---

## 4. Authentication & Authorization

### Current Implementation
| Feature | Implementation |
|---------|---------------|
| **Registration** | Email + password + phone + face descriptor (face-api.js) |
| **Login** | Email/password → optional MFA (TOTP) → JWT pair |
| **MFA** | TOTP via `otplib`, QR code for setup |
| **JWT** | `jsonwebtoken` with access + refresh token pattern |
| **Role system** | `user.role`: `ROLE_USER` / `ROLE_ADMIN` / `ROLE_MERCHANT` |
| **Admin middleware** | Checks `req.user.role === 'ROLE_ADMIN'` |
| **Merchant middleware** | Checks `req.user.role === 'ROLE_MERCHANT'` |
| **Auth middleware** | Verifies JWT, fetches user from DB every request |

### Issues
| Severity | Issue | Impact | Solution | Effort |
|----------|-------|--------|----------|--------|
| **CRITICAL** | No HTTPS | Credentials sent in cleartext | Enforce HTTPS | 1h |
| **HIGH** | Auth middleware does DB query on every request (`SELECT * FROM users WHERE id = ?`) | Performance bottleneck under load; sessions table is queried separately too | Use JWT payload for lightweight checks; cache user data in Redis; consolidate session + user queries | 4h |
| **MEDIUM** | `resend-verification` and `verify-token` have no rate limiting | Potential for email bombing | Add rate limiting | 15min |
| **MEDIUM** | `refreshToken` endpoint has no rate limiting | Refresh token replay attack vector | Add rate limiting + token family tracking | 1h |
| **LOW** | Passwords stored with bcryptjs (good), but no min-length check enforced at DB level | Weak passwords possible | Add DB constraint + stronger frontend validation | 30min |

---

## 5. API Design

### Route Structure (50+ routes in `routes/api.js`)
- **Base path**: No API version prefix (e.g., `/api/v1/...`)
- **Format**: All JSON
- **Naming**: Mixed conventions — some snake_case (`created_at`), some camelCase (`createdAt`)

### Issues
| Severity | Issue | Impact | Solution | Effort |
|----------|-------|--------|----------|--------|
| **MEDIUM** | No API versioning (`/api/` instead of `/api/v1/`) | Breaking changes affect all clients without migration path | Add `/api/v1/` prefix; maintain backward compat | 2h |
| **MEDIUM** | Mixed snake_case/camelCase in responses | Frontend must handle both; confusing | Standardize on camelCase at API boundary | 3h |
| **LOW** | No OpenAPI/Swagger docs | No discoverable API reference | Add swagger-jsdoc + swagger-ui-express | 4h |

---

## 6. Security

### Issues (consolidated)
| Severity | Issue | Location | Effort |
|----------|-------|----------|--------|
| **CRITICAL** | Plain HTTP (no HTTPS) | `backend/src/app.js` | 1h |
| **CRITICAL** | KYC files publicly accessible | `backend/uploads/kyc/` | 4h |
| **HIGH** | CORS wide open | `backend/src/app.js` | 30min |
| **HIGH** | No request size limit | `backend/src/app.js` | 5min |
| **HIGH** | No helmet configured | `backend/src/app.js` | 15min |
| **MEDIUM** | `X-Forwarded-For` trusted without validation | `auditLogger.js` — IP spoofing possible | 1h |
| **MEDIUM** | No `trust proxy` setting in Express | Rate limiting may see wrong IP behind proxy | 15min |
| **MEDIUM** | No SQL injection prevention analysis — uses parameterized queries in most places | Audit needed | 2h |

---

## 7. Frontend Architecture

### Stack
- **Framework**: Next.js 14.1.0 (App Router)
- **Styling**: Tailwind CSS 3.3 + custom CSS variables in `globals.css`
- **Icons**: `lucide-react`
- **Charts**: `recharts`
- **State**: Local React state (no Redux/Zustand)
- **API client**: Custom `apiFetch` in `lib/api.ts` with automatic token refresh, refresh queue, and idempotency key generation

### Pages
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `page.tsx` | Landing page (Hero, Features, Security, CTA) |
| `/login` | `LoginPage` | Auth with MFA support |
| `/register` | `RegisterPage` | Registration with face biometrics |
| `/dashboard` | `DashboardPage` | Main user dashboard (wallets, actions, activity) |
| `/transactions` | `TransactionsPage` | Full transaction history with filters and pagination |
| `/profile` | `ProfilePage` | User settings, KYC, limits, sessions, password |
| `/rewards` | `RewardsPage` | Loyalty points and coupon claiming |
| `/admin` | `AdminOverview` | System stats, activity, health |
| `/mfa` | MFA setup | — |
| `/kyc` | KYC upload | — |
| `/verify` | Email/phone verification | — |

### Issues
| Severity | Issue | Impact | Solution | Effort |
|----------|-------|--------|----------|--------|
| **HIGH** | `apiFetch` fallback uses `fetch("http://localhost:5000/api/...")` hardcoded | Only works in local dev | Read API URL from `NEXT_PUBLIC_API_URL` env var | 30min |
| **HIGH** | Many components use direct `fetch("http://localhost:5000/api/...")` instead of `apiFetch` | Bypasses token refresh, idempotency, and error handling | Refactor all fetches to use `apiFetch` | 2h |
| **HIGH** | `html5-qrcode` scanning — camera access UX is not handled gracefully on mobile | User may not understand why camera permission is needed | Add onboarding overlay explaining camera use | 2h |
| **MEDIUM** | No loading skeleton states; uses spinner only | Poor perceived performance | Add skeleton components for wallet, transactions, profile | 3h |
| **MEDIUM** | `cn()` utility redefined in multiple files (4+ copies) | Code duplication, maintenance burden | Extract to shared `lib/utils.ts` | 30min |
| **MEDIUM** | `requests` feature uses two different modal patterns | Inconsistent UX for money requests vs transfers | Standardize modal step pattern | 2h |
| **LOW** | No SSR/ISR for public pages (landing page is fully client-side) | Poor SEO, slower initial load | Convert landing page to server component | 3h |
| **LOW** | `TransactionDetailModal` uses `currentUserEmail` prop; no auth check | Non-critical, but could show wrong data context | — | — |

---

## 8. UX/UI

### ✅ Strengths
- Consistent fluid design language (`fluid-card`, `fluid-button`, `fluid-glass`, `fluid-input`)
- Dark/light mode via Tailwind `class` strategy + `ThemeProvider`
- Responsive modals with step progress (transfer: 3 steps, deposit: 3 steps)
- Moroccan-inspired visual elements (zellige patterns, color palette)
- High-quality typography (Inter + Outfit fonts)
- Smooth animations via `animate-in` classes
- Toast notifications for feedback
- Notification tray with mark-read/delete

### Issues
| Issue | Impact | Effort |
|-------|--------|--------|
| No empty state illustrations (only text) | Generic feel when no data | 1h |
| No keyboard shortcuts | Power users slowed down | 2h |
| Transaction list lacks desktop bulk actions | No multi-select, no batch export | 3h |

---

## 9. Testing & CI/CD

| Aspect | Status |
|--------|--------|
| **Unit tests** | ❌ None found |
| **Integration tests** | ❌ None found |
| **E2E tests** | ❌ None found |
| **Test framework** | Not configured |
| **CI/CD** | ❌ No GitHub Actions, no Docker, no docker-compose |
| **Linting** | Only `next lint` configured (frontend); no ESLint config for backend |
| **TypeScript** | Frontend only; backend is plain JS |

| Severity | Issue | Impact | Solution | Effort |
|----------|-------|--------|----------|--------|
| **HIGH** | No tests at all | Any regression goes undetected; manual QA only | Add Jest for backend unit tests, Playwright for E2E | 40h |
| **MEDIUM** | No CI/CD pipeline | Deployment is manual, error-prone | Add GitHub Actions for lint → test → build | 8h |
| **LOW** | No Docker setup | Inconsistent dev environments, no containerized deployment | Add Dockerfile + docker-compose.yml | 4h |
| **LOW** | Backend has no lint config | Code style inconsistencies | Add ESLint + Prettier for backend | 2h |

---

## 10. Deployment Readiness

### What exists
- `.env.example` with basic vars (DB, JWT secrets, SMTP)
- Next.js build script (`next build`)
- Node.js `start` script for backend

### What's missing for production
| Component | Missing | Criticality |
|-----------|---------|-------------|
| HTTPS/TLS | SSL certificate, HTTPS redirect | **CRITICAL** |
| Process manager | No PM2/forever config | HIGH |
| Reverse proxy | No nginx/Caddy config | HIGH |
| Secrets management | `.env` committed to git | HIGH |
| Health endpoints | Only `/health` with no DB check | MEDIUM |
| Logging | Console only; no structured logging (winston/pino) | MEDIUM |
| Monitoring | No APM, no error tracking (Sentry) | MEDIUM |
| Containerization | No Docker | MEDIUM |
| Database migrations | No migration system | MEDIUM |
| Static asset CDN | KYC files served from Express | MEDIUM |
| CORS | Wide open | MEDIUM |
| Compression | Not enabled | LOW |

### Environment Checklist
| Variable | Set? | Notes |
|----------|------|-------|
| `PORT` | ✅ | 5000 |
| `DATABASE_URL` | ✅ | MySQL connection string |
| `JWT_SECRET` | ❌ | `.env.example` shows placeholder text |
| `JWT_REFRESH_SECRET` | ❌ | `.env.example` shows placeholder text |
| `NODE_ENV` | ✅ | development |
| `NEXT_PUBLIC_API_URL` | ❌ | Not defined anywhere; hardcoded to localhost |
| `SMTP_*` | ❌ | Optional, emails go to console |

---

## 11. Key Feature Analysis

### P2P Transfers
- ✅ Idempotency-protected (no duplicate transfers)
- ✅ Daily/monthly limit enforcement
- ✅ Fee calculation (percentage + fixed) via riskService
- ✅ Ledger entries + notifications
- ⚠️ `Math.floor()` used for fee → potential precision loss
- ⚠️ Search endpoint returns first match only (no disambiguation)

### Deposits
- ✅ Methods: CARD, BANK_TRANSFER, MARJANE_STORE
- ✅ Idempotency-protected
- ⚠️ Frontend sends raw card details (number, expiry, CVV) to backend — no tokenization
- ⚠️ Card CVV stored in plaintext in request body
- ❌ No PCI-DSS compliance evident (card data should never touch the server)

### Virtual Cards
- ✅ Issue, refill, toggle status, regenerate card number
- ✅ Card number masking in UI (show/hide)
- ⚠️ Card data (number, cvv, expiry) stored in DB — PCI-DSS violation unless properly tokenized

### QR Payments
- ✅ Uses `html5-qrcode` library
- ✅ QR flow: scan → lookup merchant → confirm payment
- ⚠️ QR scanner has no camera permission fallback UX
- ⚠️ No scan timeout/reset mechanism

### KYC
- ✅ Document upload + auto-verify + admin review
- ⚠️ Files stored locally in `uploads/kyc/` — not production-ready
- ⚠️ No file type/size validation beyond Multer defaults
- ⚠️ `auto-verify` route lacks admin middleware

### Loyalty
- ✅ Points system (1 pt per 10 MAD spent)
- ✅ Tier system (Bronze/Silver/Gold)
- ✅ Coupon claiming with points
- ✅ Progress tracking to next tier

### Notifications
- ✅ CRUD operations (fetch, mark read, delete, mark all read)
- ✅ Notification types: PAYMENT, REQUEST, SECURITY, REWARD, SYSTEM, TRANSACTION
- ❌ **No WebSocket/SSE** — polls via fetch every 30s (admin) or on page load (users)
- ⚠️ Notification polling creates unnecessary server load

### Merchant Portal
- ✅ Merchant-specific routes with middleware
- ✅ Settlement requests + transaction history
- ✅ QR merchant lookup
- ⚠️ No merchant dashboard in frontend (only backend routes exist)
- ⚠️ Merchant onboarding flow is incomplete on frontend

---

## 12. Performance

| Area | Current State | Concern |
|------|--------------|---------|
| DB pool | 10 connections (hardcoded) | Will exhaust under moderate load |
| DB queries | Auth middleware queries DB on every request | Adds 5-10ms latency per request |
| No caching | Redis/memcached not used | Repeated DB hits for same data |
| Frontend bundle | No code splitting analysis | May ship unnecessary code |
| Images | No next/image optimization configured | Larger image payloads |
| Fonts | `optimizeFonts: false` in next.config.js | Larger initial HTML |

---

## 13. Dependencies Health

### Backend
| Package | Version | Notes |
|---------|---------|-------|
| `express` | 4.18.2 | Current |
| `mysql2` | 3.7.0 | Current |
| `helmet` | 7.1.0 | Installed but **not used** in app.js |
| `express-rate-limit` | 8.5.2 | Used ✅ |
| `multer` | 2.1.1 | Used for file uploads |
| `jsonwebtoken` | 9.0.3 | Current |
| `bcryptjs` | 3.0.3 | Outdated (latest is 2.4.3 — 3.x is a different package) |
| `nodemailer` | 8.0.7 | Current |
| `morgan` | 1.10.0 | Standard HTTP logger |
| `cors` | 2.8.5 | Current (minor) |

### Frontend
| Package | Version | Notes |
|---------|---------|-------|
| `next` | 14.1.0 | Current (14.2.x available) |
| `react` | 18.x | Current |
| `face-api.js` | 0.22.2 | Last published 2020 — unmaintained |
| `html5-qrcode` | 2.3.8 | Current |
| `lucide-react` | 0.332.0 | Current |
| `recharts` | 3.8.1 | Current |
| `tailwind-merge` | 2.2.1 | Current |

---

## 14. Recommendations (Priority-Ordered)

### Immediate (Week 1)
1. **🔴 Enforce HTTPS** — `app.js` should redirect HTTP → HTTPS and use TLS
2. **🔴 Move KYC uploads** outside source tree; serve via protected route
3. **🔴 Disable KYC auto-verify** for non-admin or add admin middleware
4. **🔴 Secure card data** — Never send/store raw CVV; use PCI-compliant tokenization
5. **🔴 Make API URL configurable** via `NEXT_PUBLIC_API_URL` in frontend
6. **🔴 Validate JWT secrets at startup** with `process.exit(1)` if missing

### Short-term (Week 2-3)
7. **🟠 Add rate limiting** to auth endpoints (resend-verification, refresh-token, verify-token)
8. **🟠 Add request body size limiter** + compression middleware
9. **🟠 Restrict CORS** to specific origins
10. **🟠 Refactor all frontend fetches** to use `apiFetch` instead of raw `fetch`
11. **🟠 Add helmet middleware** (already installed but unused)
12. **🟠 Make DB pool size configurable** via env
13. **🟠 Standardize API response format** (camelCase everywhere)

### Medium-term (Week 3-4)
14. **🟡 Add unit tests** — Jest for backend services (ledger, transfer, wallet)
15. **🟡 Add E2E tests** — Playwright for critical flows (login, transfer, deposit)
16. **🟡 Set up CI/CD** — GitHub Actions with lint → test → build
17. **🟡 Add API versioning** (`/api/v1/`)
18. **🟡 Replace `Math.floor` with decimal.js** for financial calculations
19. **🟡 Add proper error tracking** (Sentry)
20. **🟡 Add structured logging** (winston/pino)

### Long-term (Month 2+)
21. **🔵 WebSocket/SSE** for real-time notifications
22. **🔵 Redis caching** for user sessions, rate limiting, ledger queries
23. **🔵 Docker + docker-compose** for reproducible deployments
24. **🔵 Database migration system** (e.g., db-migrate or Knex)
25. **🔵 Cloud storage** (S3/Cloudinary) for KYC documents
26. **🔵 Monitoring** (Prometheus + Grafana, or DataDog)
27. **🔵 Merchant dashboard** in frontend

---

## 15. Code Quality Observations

### Good Practices
- Services are separated from controllers (separation of concerns)
- Double-entry ledger ensures transaction integrity
- Idempotency prevents duplicate financial operations
- Rate limiting on sensitive routes
- Async/await consistently used
- Environment variables via dotenv

### Anti-patterns
- Multiple copies of `cn()` utility function
- `apiFetch` defined but not consistently used
- `console.log` for auditing instead of structured logging
- Helmet installed but unused
- `.env` committed to git
- Mixed snake_case/camelCase in API responses
- Magic numbers (MySQL pool: 10, fee percentage: 0.01)

---

## 16. File Sizes Summary

| File | Lines | Purpose |
|------|-------|---------|
| `frontend/src/app/dashboard/page.tsx` | 597 | Dashboard page |
| `frontend/src/app/transactions/page.tsx` | 611 | Transaction history |
| `frontend/src/app/profile/page.tsx` | 637 | User profile/settings |
| `frontend/src/app/page.tsx` | 282 | Landing page |
| `frontend/src/components/Wallet/DepositModal.tsx` | 389 | Deposit modal |
| `frontend/src/components/Wallet/WithdrawModal.tsx` | 257 | Withdraw modal |
| `frontend/src/components/Wallet/TransferModal.tsx` | 272 | Transfer modal |
| `frontend/src/components/Wallet/RequestModal.tsx` | 251 | Request money modal |
| `frontend/src/components/Wallet/WalletCard.tsx` | 159 | Wallet card component |
| `frontend/src/components/Notifications/NotificationTray.tsx` | 167 | Notification tray |
| `backend/src/app.js` | ~150 | Express entry point |
| `backend/src/services/transferService.js` | ~200 | Transfer business logic |
| `backend/src/services/walletService.js` | ~300 | Wallet operations |
| `backend/src/services/ledgerService.js` | ~100 | Double-entry ledger |
| `backend/src/routes/api.js` | 154 | All route definitions |

---

*Audit generated June 2026 — based on full source code review.*
