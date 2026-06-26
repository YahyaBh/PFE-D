# FUNCTIONAL COMPLETION REPORT

---

## 1. Application Completion Percentage

**Overall Functional Score: 58/100**

| Category | Count | Status | Weight |
|----------|-------|--------|--------|
| Fully working (8-10/10) | 11 | 37% | ✅ |
| Partially working (4-7/10) | 12 | 40% | ⚠️ |
| Broken (1-3/10) | 4 | 13% | ❌ |
| Missing (0/10) | 3 | 10% | 🔴 |

**The core authentication loop works** (register → verify → login → MFA → dashboard). But 56% of features are either broken, incomplete, or missing entirely. A user can sign up and see a dashboard, but cannot: reset their password, complete a QR payment, receive notifications for most actions, claim loyalty rewards, get KYC reviewed by an admin, or even receive an email.

---

## 2. Feature Matrix

| # | Feature | Backend | Frontend | Integration | Status |
|---|---------|---------|----------|-------------|--------|
| 1 | Registration | ✅ | ✅ | ✅ | **COMPLETE** |
| 2 | Email/Phone Verification | ✅ | ✅ | ⚠️ Resend button dead | **PARTIAL** |
| 3 | Login | ✅ | ✅ | ✅ | **COMPLETE** |
| 4 | MFA (TOTP) | ✅ | ✅ | ⚠️ SMTP unconfigured | **PARTIAL** |
| 5 | Face ID | ✅ | ✅ | ❌ Endpoint unauthenticated | **BROKEN** |
| 6 | Dashboard | ✅ | ✅ | ✅ | **COMPLETE** |
| 7 | P2P Transfer (Send) | ✅ | ✅ | ✅ | **COMPLETE** |
| 8 | Money Request | ✅ | ✅ | ⚠️ No notification; raw fetch | **PARTIAL** |
| 9 | Deposit | ✅ | ✅ | ⚠️ No notification; raw fetch | **PARTIAL** |
| 10 | Withdrawal | ✅ | ✅ | ⚠️ No notification | **PARTIAL** |
| 11 | QR Scan & Pay | ✅ | ✅ | ❌ Wrong URL (404) | **BROKEN** |
| 12 | Virtual Cards | ✅ | ✅ | ⚠️ CVV exposed in API | **PARTIAL** |
| 13 | In-App Notifications | ✅ | ⚠️ Missing types | ⚠️ Missing triggers | **PARTIAL** |
| 14 | KYC Verification | ✅ | ✅ | ❌ No admin review page | **BROKEN** |
| 15 | Disputes | ✅ | ⚠️ No evidence/messaging UI | ⚠️ Incomplete flow | **PARTIAL** |
| 16 | Admin — Users | ✅ | ✅ | ✅ | **COMPLETE** |
| 17 | Admin — Transactions | ✅ | ✅ | ⚠️ No search/filter | **PARTIAL** |
| 18 | Admin — Disputes | ✅ | ✅ | ⚠️ No evidence/messaging | **PARTIAL** |
| 19 | Admin — Ledger | ✅ | ✅ | ⚠️ Read-only; no journal entries | **PARTIAL** |
| 20 | Admin — Broadcast | ✅ | ✅ | ⚠️ No scheduling | **PARTIAL** |
| 21 | Admin — KYC Review | ✅ | ❌ | ❌ No admin page | **BROKEN** |
| 22 | Merchant — Dashboard | ✅ | ✅ | ⚠️ Uses raw fetch | **PARTIAL** |
| 23 | Merchant — QR Code | ✅ | ✅ | ✅ | **COMPLETE** |
| 24 | Merchant — Transactions | ✅ | ❌ | ❌ Nav → 404 page | **BROKEN** |
| 25 | Merchant — Settlements | ✅ | ⚠️ No history view | ⚠️ Raw fetch | **PARTIAL** |
| 26 | Profile Management | ✅ | ✅ | ✅ | **COMPLETE** |
| 27 | Sessions | ✅ | ✅ | ⚠️ No device name display | **PARTIAL** |
| 28 | Loyalty/Rewards | ✅ | ❌ | ❌ No frontend at all | **MISSING** |
| 29 | Coupons | ✅ | ❌ | ❌ No frontend at all | **MISSING** |
| 30 | Password Recovery | ❌ | ❌ | ❌ Dead link only | **MISSING** |
| 31 | Email Notifications | ❌ SMTP config | ✅ UI | ❌ Never sent | **BROKEN** |

---

## 3. Broken Features

### 3.1 QR Scan & Pay — Always Returns 404

| Field | Value |
|-------|-------|
| **Problem** | User scans QR code → enters amount → clicks Pay → `POST /api/transactions/qr-pay` → **404 Not Found** |
| **Root Cause** | Frontend calls `/transactions/qr-pay` but backend route is `/transactions/qr-payment` |
| **Files** | `frontend/src/components/Wallet/QRScannerModal.tsx:79` |
| **Fix** | Change `"qr-pay"` to `"qr-payment"` on line 79 |
| **Time** | 2 minutes |

### 3.2 Merchant "Transactions" Nav → 404

| Field | Value |
|-------|-------|
| **Problem** | Merchant sidebar links to `/merchant/history` which doesn't exist |
| **Root Cause** | No `app/merchant/history/page.tsx` file |
| **Files** | `frontend/src/app/merchant/layout.tsx:20` |
| **Fix** | Create page or change nav to `/merchant/settlements` |
| **Time** | 15 minutes |

### 3.3 Password Recovery — Dead Link

| Field | Value |
|-------|-------|
| **Problem** | "Forgot password?" link has `href="#"` — does nothing |
| **Root Cause** | Feature never implemented |
| **Files** | `frontend/src/app/login/page.tsx:131` |
| **Fix** | Create `/forgot-password` and `/reset-password` pages + backend endpoints |
| **Time** | 4 hours |

### 3.4 Email Notifications — Never Sent

| Field | Value |
|-------|-------|
| **Problem** | `emailService.js` checks `if (!process.env.SMTP_USER)` → logs to console and returns. In production, no emails are sent. MFA codes, transfer alerts, password changes all silently fail. |
| **Root Cause** | No SMTP configuration in .env |
| **Files** | `backend/src/services/emailService.js:42-45` |
| **Fix** | Add real SMTP credentials OR add Ethereal auto-creation fallback OR integrate SendGrid/Mailgun |
| **Time** | 1 hour (with real SMTP creds) |

### 3.5 Face ID Endpoint Unauthenticated

| Field | Value |
|-------|-------|
| **Problem** | `GET /api/auth/user/:userId/face-descriptor` has no `auth` middleware — anyone can get face descriptors for any user |
| **Root Cause** | Route missing `auth` middleware |
| **Files** | `backend/src/routes/api.js:43` |
| **Fix** | Add `auth` middleware to line 43 |
| **Time** | 2 minutes |

### 3.6 Verify Page "Resend Code" Does Nothing

| Field | Value |
|-------|-------|
| **Problem** | Button has `onClick` attribute but no handler wired |
| **Root Cause** | Missing function binding |
| **Files** | `frontend/src/app/verify/page.tsx:126` |
| **Fix** | Wire the resend button to call POST /auth/verify-token with resend logic |
| **Time** | 30 minutes |

### 3.7 Test Page Accessible

| Field | Value |
|-------|-------|
| **Problem** | `/test-notifications` renders debug UI in production |
| **Root Cause** | Debug page left in app directory |
| **Files** | `frontend/src/app/test-notifications/page.tsx` |
| **Fix** | Delete the file |
| **Time** | 1 minute |

---

## 4. Incomplete Features

### 4.1 Deposit — No Notification After Success

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| `createNotification(userId, 'PAYMENT', 'Deposit Successful', ...)` after `connection.commit()` in `walletService.deposit()` | Add ~4 lines in `walletService.js` after line 75 | None needed — already fetches notifications |
| **Time:** 15 minutes | | |

### 4.2 Withdrawal — No Notification After Success

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| `createNotification(userId, 'PAYMENT', 'Withdrawal Successful', ...)` after `connection.commit()` in `walletService.withdraw()` | Add ~4 lines in `walletService.js` after line 112 | None needed |
| **Time:** 15 minutes | | |

### 4.3 Money Request — No Notification to Payer

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| `createNotification(receiverId, 'REQUEST', 'Payment Request', ...)` after INSERT in `transactionController.requestMoney()` | Add ~4 lines in `transactionController.js` after line 80 | None needed — REQUEST icon already defined in NotificationTray |
| **Time:** 15 minutes | | |

### 4.4 QR Payment — No Notification to Receiver

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| `createNotification(receiverUserId, 'PAYMENT', 'Payment Received via QR', ...)` in `transactionController.processQRPayment()` | Add ~4 lines (need receiver lookup) | None needed |
| **Time:** 20 minutes | | |

### 4.5 Deposit/Request/QR Use Raw fetch() Instead of apiFetch

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| Idempotency keys and token refresh for deposit, request, and QR flows | None needed | Replace raw `fetch()` with `apiFetch()` in 3 modals |
| **Time:** 30 minutes | | |

**Files:** `DepositModal.tsx:33,49`, `RequestModal.tsx:36,58`, `QRScannerModal.tsx:43,79`

### 4.6 Notification Type Icons Missing

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| `SYSTEM` type maps to default Bell (dispute resolution notifications look wrong) | None | Add icon mapping in NotificationTray.tsx |
| `TRANSACTION` type maps to default Bell (card refill looks wrong) | None | Add icon mapping |
| `REQUEST` icon defined but never created by backend | Already covered in 4.3 | None needed once 4.3 is done |
| `REWARD` icon defined but never created | Will be needed when loyalty is built | None needed yet |
| **Time:** 10 minutes | | |

### 4.7 KYC — Admin Review Page Missing

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| Admin cannot review KYC submissions | `POST /api/kyc/review` exists | New page: `/admin/kyc` |
| **Backend work** | None needed — endpoint exists | |
| **Frontend work** | New page: list PENDING verifications, show documents, Approve/Reject buttons | ~3 hours |
| **Time:** 3 hours | | |

### 4.8 KYC — Resubmit Only Resets Local State

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| After KYC rejection, clicking "Resubmit" should reset backend status to UNVERIFIED | None — resubmit re-uploads and re-submits via existing endpoints | Fix local state to properly flow through re-upload → re-submit |
| **Time:** 30 minutes | | |

### 4.9 Dispute — No Evidence Upload UI

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| Users can't attach evidence to disputes | `dispute_evidence` table exists, but no POST/DELETE endpoint | File upload UI in dispute creation modal |
| **Backend work** | Create `POST /disputes/evidence` (multer upload) + `DELETE /disputes/evidence/:id` | ~1 hour |
| **Frontend work** | File upload step in dispute creation modal | ~2 hours |
| **Time:** 3 hours | | |

### 4.10 Dispute — No Messaging UI

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| Users and admins can't communicate per dispute | `POST /disputes/message` exists, `GET /disputes/messages` doesn't | Chat-style message thread in dispute detail view |
| **Backend work** | Create `GET /disputes/:id/messages` | ~30 minutes |
| **Frontend work** | Message thread component in TransactionDetailModal or admin dispute view | ~2 hours |
| **Time:** 2.5 hours | | |

### 4.11 Dispute — No Notification When Created

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| `createNotification(userId, 'SYSTEM', 'Dispute Submitted', ...)` after INSERT | Add ~4 lines in `disputeController.createDispute()` | None |
| **Time:** 15 minutes | | |

### 4.12 Logout — Never Calls API

| What's Missing | Backend | Frontend |
|----------------|---------|----------|
| Frontend clears localStorage but never `POST /api/auth/logout` | Already exists | Add API call before clearing tokens in all logout handlers |
| **Time:** 30 minutes | | |

**Files:** `Navbar.tsx:26`, `admin/layout.tsx:51`, `merchant/layout.tsx`, `dashboard/page.tsx` (handleLogout)

---

## 5. Missing Frontend Screens

| # | Screen | Reason | Complexity |
|---|--------|--------|------------|
| 1 | **Forgot Password** `/forgot-password` | Dead link on login page | Medium |
| 2 | **Reset Password** `/reset-password?token=X` | Required after forgot password | Medium |
| 3 | **Rewards & Loyalty** `/rewards` | Backend has everything, no frontend | Medium |
| 4 | **Coupon Center** (inside rewards or separate) `/rewards/coupons` | Users can't claim/view coupons | Small |
| 5 | **Admin KYC Review** `/admin/kyc` | No way to approve/reject KYC | Large |
| 6 | **Merchant Transactions** `/merchant/history` | Nav link is broken (404) | Small (redirect or simple table) |
| 7 | **Merchant Settlement History** (inside `/merchant/settlements`) | After requesting, no history view | Small |
| 8 | **Dispute Message Thread** (inside dispute modals) | No user↔admin messaging | Medium |
| 9 | **Dispute Evidence Upload** (inside dispute creation modal) | No file attachments | Small |
| 10 | **Contact/Support** `/support` | Customer support contact | Small |
| 11 | **Terms of Service** `/terms` | Legal requirement for fintech | Small |
| 12 | **Privacy Policy** `/privacy` | Legal requirement for fintech | Small |

---

## 6. Missing Backend Endpoints

| # | Method | Route | Purpose | Needed For |
|---|--------|-------|---------|------------|
| 1 | POST | `/auth/forgot-password` | Send reset email with token | Forgot password flow |
| 2 | POST | `/auth/reset-password` | Accept token + new password | Reset password flow |
| 3 | GET | `/disputes/:id/messages` | Get all messages for a dispute | Dispute messaging UI |
| 4 | POST | `/disputes/evidence` | Upload evidence file (multer) | Dispute evidence |
| 5 | DELETE | `/disputes/evidence/:id` | Delete evidence file | Dispute evidence |
| 6 | GET | `/loyalty/coupons` | List available + claimed coupons | Rewards frontend |
| 7 | GET | `/admin/kyc/pending` | List all KYC with status=PENDING | Admin KYC review page |
| 8 | PATCH | `/admin/kyc/:id/status` | Approve/reject KYC (exists as `/kyc/review`) | Already exists, just needs admin route alias |
| 9 | GET | `/admin/reports/transactions` | Export transaction report (CSV/JSON) | Admin reporting (nice-to-have) |
| 10 | POST | `/auth/logout` (all) | Already exists but frontend never calls it | Logout consistency |

---

## 7. Missing Integrations

### Frontend Exists But API Not Connected

| # | Frontend | API Endpoint | Status |
|---|----------|-------------|--------|
| 1 | `Navbar.tsx` logout button → clears localStorage | `POST /api/auth/logout` | **Never called** |
| 2 | `admin/layout.tsx` logout → clears localStorage | `POST /api/auth/logout` | **Never called** |
| 3 | `merchant/layout.tsx` logout → clears localStorage | `POST /api/auth/logout` | **Never called** |
| 4 | `/verify` page "Resend Code" button | `POST /api/auth/verify-token` | **No handler bound** |
| 5 | Login page "Biometric Sign In" → BiometricOverlay | Face ID comparison | **Stub — no actual Face ID login flow** |
| 6 | Login page "Forgot password?" link | No endpoint exists | **href="#" dead link** |

### API Exists But Frontend Not Connected

| # | API Endpoint | Frontend | Status |
|---|-------------|----------|--------|
| 1 | `GET /api/loyalty/status` | No page | **Orphaned** |
| 2 | `POST /api/loyalty/claim` | No page | **Orphaned** |
| 3 | `GET /api/kyc/documents` | KYC page uses `/kyc/status` (same data) | **Unused but redundant** |
| 4 | `POST /api/kyc/review` | No admin page | **Orphaned** |
| 5 | `GET /api/disputes/my` | Overridden by `GET /api/disputes` | **Unused duplicate** |
| 6 | `POST /api/disputes/message` | No UI | **Orphaned** |
| 7 | `POST /api/admin/user/suspend` | Superseded by `POST /admin/users/status` | **Unused** |

### Database Tables Not Used

| # | Table | What It's For | Status |
|---|-------|---------------|--------|
| 1 | `dispute_evidence` | File attachments for disputes | **No endpoint to read/write** |
| 2 | `coupons` | Available discount coupons | **No frontend to list/claim** |
| 3 | `user_coupons` | User's claimed coupons | **No frontend to view** |

### Notifications Not Triggered

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Deposit completes | `PAYMENT` notification | **Missing** |
| 2 | Withdrawal completes | `PAYMENT` notification | **Missing** |
| 3 | Money request created | `REQUEST` notification to payer | **Missing** |
| 4 | QR payment completes | `PAYMENT` notification to receiver | **Missing** |
| 5 | Dispute created | `SYSTEM` notification to user | **Missing** |
| 6 | Dispute created | Notification to admins | **Missing** |
| 7 | Admin reverses transaction | Notification to affected user | **Missing** |
| 8 | New device login detected | `SECURITY` notification | **Missing** |

---

## 8. User Journey Audit

### Registration Journey — 9/10

```
Start: /register → Step 1 (info) → Step 2 (face) → POST /auth/register → /verify → /dashboard
```
- ✅ Two-step form with validation
- ✅ Face capture on registration
- ✅ User + wallet created in DB transaction
- ✅ Verification codes logged (security issue but functional)
- ✅ Email/phone verification flow
- ✅ Already-logged-in guard
- ❌ "Resend Code" button on /verify does nothing (-1)

### Login Journey — 8/10

```
Start: /login → POST /auth/login → /mfa → face match → POST /auth/verify-mfa → /dashboard
```
- ✅ Email/password with validation
- ✅ MFA code generation and verification
- ✅ Face ID comparison (client-side)
- ✅ Token + refresh token storage
- ✅ Admin role → /admin redirect
- ✅ Session expiry auto-refresh
- ❌ "Forgot password?" link is dead (-1)
- ❌ Face descriptor endpoint unauthenticated (-1)

### Wallet Journey — 6/10

```
Dashboard → Send/Deposit/Withdraw/Request/QR → Modal → API → Result
```
- ✅ Send: complete with fees, limits, fraud check, ledger, notifications, email
- ⚠️ Deposit: no notification, raw fetch (missing idempotency) (-1)
- ⚠️ Withdraw: no notification (-1)
- ⚠️ Request: no notification to payer, raw fetch (-1)
- ❌ QR Pay: always 404 (-1)

### Card Journey — 8/10

```
Dashboard / /cards → Issue → Freeze → Refill → Regenerate → Delete
```
- ✅ Full lifecycle with notifications
- ✅ Ownership verification on every mutation
- ✅ Tier-based limits on issuance
- ✅ Wallet → card refill
- ❌ CVV returned in API responses (PCI DSS, but doesn't break functionality) (-1)
- ❌ No card spending controls (-1)

### KYC Journey — 4/10

```
/profile → /kyc → upload documents → submit → wait for review → approved/rejected
```
- ✅ 5-step wizard with file upload
- ✅ Submit for review
- ✅ Auto-verify (risk score ≥ 80)
- ✅ Notifications on submit/approve/reject
- ❌ Admin review page doesn't exist → user can never get reviewed if auto-verify fails (-2)
- ❌ Resubmit after rejection only resets local state, not backend (-1)
- ❌ No document delete API call from frontend (-1)
- ❌ File upload only validates extension (-1)
- ❌ No way to view uploaded documents (-1)

### Dispute Journey — 3/10

```
/transactions → Report Issue → POST /api/disputes → Admin reviews → POST /api/admin/disputes/resolve → done
```
- ✅ User can create dispute from transaction
- ✅ Admin can resolve with refund/reject
- ✅ Ledger reversal for refund
- ❌ No evidence upload UI (-2)
- ❌ No admin↔user messaging (-2)
- ❌ No notification when dispute is created (-1)
- ❌ No notification to admins (-1)
- ❌ backend has `dispute_messages` table + `POST /disputes/message` but no frontend (-1)

### Merchant Journey — 3/10

```
/merchant/dashboard → see stats → QR code → settlements
```
- ✅ Merchant stats endpoint
- ✅ Merchant access guard (layout checks /api/merchant/stats)
- ✅ QR code page
- ✅ Settlement request endpoint
- ❌ "Transactions" nav → 404 (-2)
- ❌ No merchant onboarding flow (-2)
- ❌ No settlement history (-1)
- ❌ No notification on settlement creation/completion (-1)
- ❌ No way to become a merchant from frontend (-1)

### Rewards Journey — 0/10

```
(Frontend missing entirely)
```
- ✅ Backend: `GET /api/loyalty/status`, `POST /api/loyalty/claim`
- ✅ Database: `coupons`, `user_coupons`, `users.loyalty_points`
- ❌ No frontend page to view points, coupons, or claim rewards (-10)

### Admin Journey — 5/10

```
/admin → users → transactions → disputes → ledger → audit → broadcast
```
- ✅ Admin panel with sidebar navigation
- ✅ User management (list, suspend, reset MFA)
- ✅ Transaction list + reverse
- ✅ Dispute resolution
- ✅ Ledger read-only view
- ✅ Audit logs
- ✅ Broadcast notifications
- ❌ No KYC review page (-2)
- ❌ No evidence viewing in disputes (-1)
- ❌ No admin notification when dispute created (-1)
- ❌ Ledger is read-only (no journal entry creation) (-1)

---

## 9. Functional Completion Roadmap

### PHASE A — Fix Broken Features (6 hours)

| # | Task | Priority | Hours | Dependencies | Files |
|---|------|----------|-------|--------------|-------|
| A1 | Fix QR payment URL | 🔴 Critical | 0.1 | None | `QRScannerModal.tsx:79` |
| A2 | Add auth middleware to face-descriptor | 🔴 Critical | 0.1 | None | `routes/api.js:43` |
| A3 | Fix or remove merchant history nav | 🔴 Critical | 0.5 | None | `merchant/layout.tsx:20` |
| A4 | Wire verify page resend button | 🔴 Critical | 0.5 | None | `verify/page.tsx` |
| A5 | Delete test-notifications page | 🟡 Medium | 0.1 | None | Delete file |
| A6 | Configure real SMTP / email fallback | 🔴 Critical | 1 | Backend `.env` | `emailService.js`, `.env` |
| A7 | Create forgot-password + reset-password | 🔴 Critical | 4 | None | 2 pages + 2 endpoints |

### PHASE B — Complete Partial Features (16 hours)

| # | Task | Priority | Hours | Dependencies | Files |
|---|------|----------|-------|--------------|-------|
| B1 | Add deposit notification | 🟡 Medium | 0.3 | None | `walletService.js:75` |
| B2 | Add withdrawal notification | 🟡 Medium | 0.3 | None | `walletService.js:112` |
| B3 | Add money request notification | 🟡 Medium | 0.3 | None | `transactionController.js:80` |
| B4 | Add QR payment receiver notification | 🟡 Medium | 0.3 | None | `transactionController.js:254` |
| B5 | Add dispute created notification | 🟡 Medium | 0.3 | None | `disputeController.js:createDispute` |
| B6 | Add notification icon types (SYSTEM, TRANSACTION) | 🟢 Low | 0.2 | None | `NotificationTray.tsx` |
| B7 | Migrate DepositModal to apiFetch | 🟡 Medium | 0.3 | None | `DepositModal.tsx` |
| B8 | Migrate RequestModal to apiFetch | 🟡 Medium | 0.3 | None | `RequestModal.tsx` |
| B9 | Migrate QRScannerModal to apiFetch | 🟡 Medium | 0.3 | None | `QRScannerModal.tsx` |
| B10 | Migrate admin pages to apiFetch | 🟡 Medium | 1 | None | 8 admin page files |
| B11 | Migrate merchant pages to apiFetch | 🟡 Medium | 0.5 | None | 4 merchant files |
| B12 | Wire logout to call API | 🟡 Medium | 0.5 | None | Navbar, layouts, dashboard |
| B13 | Fix KYC resubmit flow | 🟡 Medium | 0.5 | None | `kycController.js`, `kyc/page.tsx` |
| B14 | Fix KYC document delete button | 🟢 Low | 0.3 | None | `kyc/page.tsx:111` |
| B15 | Add deposit/withdraw limit to admin | 🟢 Low | 2 | None | Admin transaction page |
| B16 | Add merchant settlement history view | 🟢 Low | 2 | B10 | Settlement page |

### PHASE C — Connect Orphaned Systems (18 hours)

| # | Task | Priority | Hours | Dependencies | Files |
|---|------|----------|-------|--------------|-------|
| C1 | Create loyalty/rewards page | 🟡 Medium | 4 | None | New page + connect to existing endpoints |
| C2 | Create coupon claim UI inside rewards | 🟡 Medium | 2 | C1 | Coupon list + claim button |
| C3 | Create admin KYC review page | 🔴 Critical | 4 | None | New page + connect to existing endpoint |
| C4 | Create dispute evidence upload | 🟡 Medium | 2 | None | Backend endpoint + frontend UI |
| C5 | Create dispute messaging | 🟡 Medium | 3 | None | Backend endpoint + frontend UI |
| C6 | Create merchant history page (simple table) | 🟡 Medium | 2 | B10 | New page |
| C7 | Create basic support page | 🟢 Low | 1 | None | Static page |

### PHASE D — Finish Missing Features (12 hours)

| # | Task | Priority | Hours | Dependencies | Files |
|---|------|----------|-------|--------------|-------|
| D1 | Create forgot password backend | 🔴 Critical | 2 | None | 2 new endpoints |
| D2 | Create reset password page | 🔴 Critical | 2 | D1 | New page |
| D3 | Create forgot password page | 🔴 Critical | 1 | D1 | New page |
| D4 | Wire Biometric Sign In on login | 🟡 Medium | 3 | None | Login page + BiometricOverlay |
| D5 | Add merchant onboarding | 🟢 Low | 2 | None | New flow |
| D6 | Create admin journal entry | 🟢 Low | 2 | None | New endpoint + UI |
| D7 | Add admin notification on new dispute | 🟡 Medium | 0.5 | None | Backend |
| D8 | Add admin reverse transaction notification | 🟡 Medium | 0.3 | None | Backend |

---

## 10. Exact Build Order

This is the exact order to maximize the number of working features. Each step is a complete unit of work.

```
DAY 1 — Fix Broken Things (critical path)

  1.  Fix QR payment URL (2 min)
      File: QRScannerModal.tsx:79

  2.  Add auth middleware to face-descriptor route (2 min)
      File: routes/api.js:43

  3.  Delete test-notifications page (1 min)
      File: Delete frontend/src/app/test-notifications/

  4.  Fix merchant history nav (15 min)
      File: merchant/layout.tsx:20 — change href to /merchant/settlements or create page

  5.  Wire verify page resend code button (30 min)
      File: verify/page.tsx — add handleResend function

  6.  Add 5 missing notifications (1 hour total):
      - Deposit: walletService.js:75
      - Withdrawal: walletService.js:112
      - Money request: transactionController.js:80
      - QR payment receiver: transactionController.js:254
      - Dispute created: disputeController.js:createDispute

  7.  Fix NotificationTray icon types (10 min)
      File: NotificationTray.tsx — add SYSTEM and TRANSACTION icons

  8.  Wire logout to call API (30 min)
      Files: Navbar.tsx, admin/layout.tsx, merchant/layout.tsx, dashboard/page.tsx

  9.  Configure SMTP or integrate SendGrid (1 hour)
      File: emailService.js

 10.  Create forgot password + reset password (4 hours):
      - Backend: POST /auth/forgot-password, POST /auth/reset-password
      - Frontend: /forgot-password, /reset-password pages
      - Fix login page link

DAY 2 — Complete Partial Features

 11.  Migrate DepositModal to apiFetch (20 min)
      File: DepositModal.tsx

 12.  Migrate RequestModal to apiFetch (20 min)
      File: RequestModal.tsx

 13.  Migrate QRScannerModal to apiFetch (20 min)
      File: QRScannerModal.tsx

 14.  Migrate all admin pages to apiFetch (1 hour)
      Files: 8 admin page files

 15.  Migrate all merchant pages to apiFetch (30 min)
      Files: 4 merchant files

 16.  Fix KYC resubmit (30 min)
      Files: kycController.js, kyc/page.tsx

 17.  Fix KYC document delete (20 min)
      File: kyc/page.tsx:111

 18.  Add merchant settlement history (2 hours)
      File: settlements/page.tsx

 19.  Create merchant history page (2 hours)
      File: new page + connect to existing endpoints

DAY 3 — Connect Orphaned Systems

 20.  Create loyalty/rewards page (4 hours)
      Files: New /rewards page, connect to GET /loyalty/status, POST /loyalty/claim

 21.  Create coupon claim UI (2 hours)
      Files: Update /rewards page with coupon list + claim buttons

 22.  Create dispute evidence upload (2 hours)
      Files: New backend endpoints + frontend UI in dispute modal

 23.  Create dispute messaging (3 hours)
      Files: GET /disputes/:id/messages endpoint + frontend thread UI

 24.  Add admin notification on new dispute (30 min)
      File: Backend

 25.  Add admin reverse transaction notification (20 min)
      File: Backend

 26.  Wire Biometric Sign In on login page (3 hours)
      Files: login/page.tsx, BiometricOverlay.tsx

DAY 4 — Admin & Merchant Polish

 27.  Create admin KYC review page (4 hours)
      Files: New page + connect to POST /api/kyc/review

 28.  Add admin journal entry creation (2 hours)
      Files: New endpoint + UI

 29.  Add merchant onboarding flow (2 hours)
      Files: New flow or form

 30.  Create basic support/contact page (1 hour)
      Files: New static page
```

**Total estimated time: ~48 hours (6 working days)**

---

## 11. Final Functional Score Projection

| Phase | Score | What's Included |
|-------|-------|-----------------|
| **Current** | **58/100** | Core auth works, payments partially work, broken features exist |
| After Phase A | **72/100** | All broken features fixed, QR works, password recovery exists, SMTP works |
| After Phase B | **82/100** | All notifications wired, apiFetch everywhere, logout fixed, KYC resubmit fixed |
| After Phase C | **92/100** | Loyalty page exists, coupons claimable, disputes have evidence+messaging, admin KYC review exists, merchant history exists |
| After Phase D | **97/100** | Biometric login wired, merchant onboarding, admin journal entries, support page, forgotten rewrites done |

### Top 20 Tasks That Give the Biggest Improvement

| # | Task | Hours | Score Gain | Cumulative |
|---|------|-------|------------|------------|
| 1 | Fix QR payment URL | 0.1 | +5 | 63 |
| 2 | Fix password recovery | 4 | +8 | 71 |
| 3 | Add auth middleware to face endpoint | 0.1 | +3 | 74 |
| 4 | Configure SMTP / email | 1 | +5 | 79 |
| 5 | Add 5 missing notifications | 1.5 | +4 | 83 |
| 6 | Wire logout API calls | 0.5 | +1 | 84 |
| 7 | Fix verify page resend | 0.5 | +1 | 85 |
| 8 | Fix merchant history nav | 0.5 | +2 | 87 |
| 9 | Migrate all raw fetches to apiFetch | 2 | +2 | 89 |
| 10 | Create loyalty/rewards page | 4 | +3 | 92 |
| 11 | Create admin KYC review page | 4 | +3 | 95 |
| 12 | Create dispute messaging | 3 | +2 | 97 |
| 13 | Create dispute evidence upload | 2 | +1 | 98 |
| 14 | Fix KYC resubmit | 0.5 | +1 | 99 |
| 15 | Fix notification icon types | 0.2 | +0.5 | 99.5 |
| 16 | Create merchant history page | 2 | +1 | 100.5 |
| 17 | Add merchant settlement history | 2 | +0.5 | 101 |
| 18 | Wire Biometric Sign In | 3 | +1 | 102 |
| 19 | Add merchant onboarding | 2 | +0.5 | 102.5 |
| 20 | Create support/contact page | 1 | +0.5 | 103 |

**The first 5 tasks alone give 25 points of improvement in 6.5 hours.**
