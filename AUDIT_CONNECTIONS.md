# COMPLETE SYSTEM CONNECTION AUDIT — Marjane Digital Wallet

---

## FULLY WORKING FLOWS

### 1. User Registration → Email/Phone Verification
```
Landing → /register → POST /auth/register → /verify?userId=X → POST /auth/verify-token → /dashboard
```
- [x] Form collects name, email, phone, password
- [x] FaceAuth captures biometric on step 2
- [x] Backend validates, creates user + wallet, logs MFA codes (to console — security issue)
- [x] Redirects to /verify with userId
- [x] Email step verifies via verify-token endpoint
- [x] Phone step follows email success
- [x] Token stored, redirect to /dashboard
- [x] Already-logged-in guard redirects to /dashboard

### 2. Login → MFA → Dashboard
```
Landing → /login → POST /auth/login → /mfa?email=X&userId=X
    → GET /auth/user/:id/face-descriptor → client-side face match
    → POST /auth/verify-mfa → /dashboard (or /admin for ROLE_ADMIN)
```
- [x] Email/password form with validation
- [x] MFA code sent (simulated) and verified
- [x] Face ID comparison (client-side Euclidean + Cosine)
- [x] Token + refreshToken stored
- [x] Admin role detected → /admin redirect
- [x] Session expiry guard in apiFetch (auto-refresh on 401)

### 3. Dashboard → All 6 API Endpoints Return 200
```
/api/auth/me → user profile + wallet balance
/api/transactions/recent → 20 latest transactions
/api/cards → virtual cards list
/api/transactions/requests → pending money requests
/api/notifications → user notifications
/api/dashboard/stats → pending sum, spending sum, loyalty points, last transaction
```
- [x] All 6 endpoints return data
- [x] safeJson() fallback prevents crashes on non-OK responses
- [x] Roles checked: admin → /admin redirect

### 4. P2P Transfer (Send Money)
```
Dashboard [Send] → TransferModal → POST /api/transactions/transfer (apiFetch)
    → transferService → feeService → riskService → limitService
    → walletRepository → transactionRepository → ledgerService
```
- [x] Search recipient by email/phone
- [x] Fee calculation (tier-based percentage)
- [x] Fraud velocity check
- [x] Daily/monthly limit check
- [x] Balance check (incl. fees)
- [x] FOR UPDATE pessimistic locking
- [x] Double-entry ledger (sender -, receiver +, fees account +)
- [x] Loyalty points earned
- [x] Notifications: "Money Sent" + "Money Received"
- [x] Email alert to sender
- [x] Audit log
- [x] Balance refresh on success

### 5. Virtual Card Full Lifecycle
```
Cards Page: Issue → Freeze → Refill → Regenerate → Delete
```
- [x] POST /cards/issue (with limit check for BRONZE tier)
- [x] GET /cards (list all cards)
- [x] PATCH /cards/status (freeze/unfreeze)
- [x] POST /cards/refill (wallet → card)
- [x] POST /cards/:id/regenerate (new number/CVV)
- [x] DELETE /cards/:cardId
- [x] Notifications for every action
- [x] Ownership verification on every mutation

### 6. Admin System Overview
```
/admin → GET /admin/system/overview
```
- [x] Total users, daily volume, pending KYC, active now, recent audit logs
- [x] Sidebar navigation to all admin sub-pages

### 7. Profile Management
```
/profile → GET /auth/me + /profile/face-status + /profile/sessions + /notifications
```
- [x] Update name/phone via PATCH /profile
- [x] Change password via POST /profile/change-password
- [x] View active sessions via GET /profile/sessions
- [x] Logout all devices via POST /profile/logout-all
- [x] Face ID status / removal via GET /profile/face-status + DELETE /profile/face-auth
- [x] KYC status link to /kyc
- [x] Notifications with mark-read/mark-all-read/delete

---

## PARTIALLY WORKING FLOWS

### 1. Deposit
```
Dashboard [Deposit] → DepositModal → POST /api/deposit/process
```
- [x] Select method (Card/Bank/Crypto)
- [x] Form validation (card format, min amount)
- [x] Backend deposit with locking + ledger entries
- [x] onSuccess → dashboard refresh
- [x] Idempotency key supported
- [ ] **Uses raw `fetch()` instead of `apiFetch`** — no token refresh handling
- [ ] **No notification created** on deposit success
- [ ] Fee visibility not shown to user

### 2. Withdrawal
```
Dashboard [Withdraw] → WithdrawModal → POST /api/transactions/withdraw
```
- [x] Select method (Bank/Debit Card)
- [x] Balance + limit validation
- [x] Fee calculation
- [x] Uses apiFetch with idempotency
- [x] Backend withdrawal with ledger entries
- [ ] **No notification created** on withdrawal success
- [ ] Fee not shown before confirmation

### 3. Money Request
```
Dashboard [Receive] → RequestModal → POST /api/transactions/request
```
- [x] Search payer by email/phone
- [x] Create REQUEST transaction with PENDING status
- [x] Dashboard fetches /transactions/requests
- [x] Approve/Reject via POST /transactions/process-request
- [ ] **Uses raw `fetch()`** instead of apiFetch
- [ ] **No notification sent** to the payer when a request is created
- [ ] No email alert

### 4. Dispute Resolution
```
User: /transactions → [Report Issue] → POST /api/disputes
Admin: /admin/disputes → POST /api/admin/disputes/resolve
```
- [x] User can create dispute from transaction list
- [x] Backend checks transaction ownership, duplicate check
- [x] Admin can approve refund (with wallet reversal) or reject
- [x] Ledger entries for refund reversal
- [x] Notification sent to user on resolution
- [ ] **No notification created** when dispute is opened (user gets no confirmation)
- [ ] **No email notification** on dispute status change
- [ ] **No evidence upload** in frontend (backend table `dispute_evidence` exists but unused)
- [ ] **No messaging** between user/admin (backend has `POST /disputes/message` + `dispute_messages` table, frontend has no UI)

### 5. KYC Verification
```
/profile → [Start Verification] → /kyc → 5-step wizard → POST /api/kyc/submit
    → Admin review → POST /api/kyc/review → notification
```
- [x] Document upload (Government ID, Selfie, Address Proof)
- [x] Submit for review
- [x] Auto-verify (risk score >= 80)
- [x] Admin review endpoints exist
- [x] Notifications on submit/approve/reject/auto-verify
- [ ] **No delete-document API call** from frontend (button exists inline on step 0, but no handler wired: line 111-113 only sets local state)
- [ ] **Resubmit after rejection only resets local state** — no API call to reset backend status
- [ ] **No file serving endpoint** — uploaded documents are stored but never retrievable
- [ ] **No admin review UI** — admin endpoint exists but there's no admin page for reviewing KYC
- [ ] **No notification for individual document uploads** (only on full submit)

### 6. Admin User Management
```
/admin/users → GET /admin/users → POST /admin/users/status → POST /admin/users/reset-mfa
```
- [x] List all users
- [x] Toggle user status (suspend/unsuspend)
- [x] Reset user MFA
- [x] Notifications on status change
- [ ] **Suspend + unsuspend routes unused** — superseded by POST /admin/users/status toggle
- [ ] **No direct link** from dashboard to admin for admin users (dashboard redirects to /admin, but no "Admin Panel" button visible in normal nav)

### 7. Merchant Portal
```
/merchant/dashboard → GET /merchant/stats
/merchant/qr → GET /merchant/stats
/merchant/settlements → GET /merchant/stats + POST /merchant/settlements
```
- [x] Layout checks merchant access via /api/merchant/stats
- [x] Dashboard with stats
- [x] QR code display page
- [x] Settlement request
- [ ] **"Transactions" nav link broken** — href="/merchant/history" but no page exists
- [ ] **No notification on settlement** creation or completion
- [ ] No merchant onboarding flow

---

## BROKEN FLOWS

### 1. QR Scan & Pay — URL MISMATCH (404)
```
QRScannerModal: POST /api/transactions/qr-pay
Backend route:  POST /api/transactions/qr-payment
```
- [x] QR scanner works (reads QR codes, pauses after first scan)
- [x] Search works (finds recipient by scanned ID)
- [x] Amount entry + confirmation UI works
- [ ] **CRITICAL: POST to wrong URL** → always gets 404
- [ ] User is stuck at "error" with no way to complete payment

**Fix needed in:** `frontend/src/components/Wallet/QRScannerModal.tsx:79`
Change `qr-pay` → `qr-payment`

### 2. Merchant "Transactions" Nav — DEAD LINK
```
Merchant sidebar → href="/merchant/history"
```
- [ ] Route `/merchant/history/page.tsx` does not exist
- [ ] Clicking gives Next.js 404 page
- [ ] No fallback or redirect configured

### 3. SMTP Not Configured — EMAILS NEVER SENT
```
emailService.js: if (!process.env.SMTP_USER) { console.log(...); return; }
```
- [x] Code gracefully falls back to console.log
- [ ] **In production, no emails are sent** — MFA codes, transaction alerts, and password change confirmations all silently fail
- [ ] User experience: requests MFA code → "Code sent" message → never receives anything

### 4. Forgot Password — PLACEHOLDER LINK
```
/login page: "Forgot password?" link → href="#"
```
- [ ] Link points to `#` — does nothing
- [ ] No backend endpoint for password reset
- [ ] User who forgets password is permanently locked out

### 5. Test Page Accessible in Production
```
/test-notifications → renders test notification UI
```
- [ ] Live at `/test-notifications` — accessible to any user
- [ ] No guard, no environment check

### 6. Resend Code on Verify Page — BUTTON DOES NOTHING
```
/verify page: "Resend Code" button
```
- [ ] Button has `onClick` attribute but no handler function bound
- [ ] Clicking does nothing, no console error

---

## ORPHANED FEATURES (Backend Exists, No Frontend)

| # | Feature | Backend Endpoints | Database Tables | Frontend |
|---|---------|-------------------|-----------------|----------|
| 1 | **Loyalty/Coupons** | GET /loyalty/status, POST /loyalty/claim | coupons, user_coupons | **No UI** — loyalty points appear in dashboard stats but no way to view/claim coupons |
| 2 | **Dispute Evidence Upload** | dispute_evidence table, no endpoint | dispute_evidence | **No UI** — backend table exists with no API endpoint to upload/download |
| 3 | **Dispute Messaging** | POST /disputes/message | dispute_messages | **No UI** — backend supports admin↔user messages but frontend has no chat/thread view |
| 4 | **Admin KYC Review** | POST /api/kyc/review (admin) | kyc_reviews | **No admin page** — admin can't review/reject/approve KYC from any admin panel |
| 5 | **Admin Ledger Journal Entry** | Backend can read ledger | ledger_accounts, ledger_entries | **No create UI** — admin/ledger has TODO comment |
| 6 | **Scheduled Broadcast** | POST /admin/broadcast (immediate) | notifications | **No scheduling UI** — admin/broadcast has TODO comment |
| 7 | **Document Auto-Classification** | N/A (frontend only) | N/A | **TODO comment** in kyc/page.tsx |
| 8 | **Merchant Settlement History** | POST /merchant/settlements | merchant_settlements | **TODO comment** in settlements page |
| 9 | **Admin Suspend User** | POST /admin/user/suspend | users.status | **Unused** — superseded by /admin/users/status toggle |
| 10 | **Admin Unsuspend User** | POST /admin/user/unsuspend | users.status | **Unused** — superseded by /admin/users/status toggle |

---

## ORPHANED FRONTEND (UI Exists, No Backend)

| # | Frontend Feature | Files | Backend Status |
|---|-----------------|-------|----------------|
| 1 | `/test-notifications` page | frontend/src/app/test-notifications/page.tsx | **No backend needed** — this is debug/test UI that should not be in production |
| 2 | Biometric sign-in button on login | login/page.tsx → BiometricOverlay | **Works** — FaceAuth is functional but ONLY collects face on register. On login, the biometric overlay may not connect to any API endpoint for verification |
| 3 | `cn()` utility function | Multiple files | Not a backend issue — unused but harmless |

---

## DEAD END PAGES

| # | Page | User Reaches By | What They See | What They Can Do Next | Problem |
|---|------|-----------------|---------------|----------------------|---------|
| 1 | **/verify?step=phone** | After email verification | Phone code input | Enter code → /dashboard | "Resend Code" button does nothing |
| 2 | **/merchant (via sidebar Transactions)** | Click "Transactions" in merchant sidebar | Next.js 404 page | Only back/close | Page doesn't exist |
| 3 | **/login → Forgot Password** | Click "Forgot password?" link | Page scrolls to top (href="#") | Nothing — link is dead | No password reset flow |
| 4 | **/merchant/settlements** | Click "Settlements" in merchant sidebar | Settlement request form | Can request but no history view | After requesting, no way to see status |
| 5 | **/kyc (after REJECTED)** | Profile → Start Verification → Upload → Submit → Rejected | Rejection reason, "Resubmit" button | Resubmit only resets local state | No backend call to reset kyc_verifications status |
| 6 | **Admin Ledger page** | Admin sidebar → General Ledger | Ledger summary + entries read-only | Can only view | TODO: "Add journal entry creation" — no create UI |

---

## MISSING CONNECTIONS

### Authentication & Session
| Connection | Status |
|------------|--------|
| Login page → Biometric sign-in button | BiometricOverlay component exists but actual Face ID login flow uses /mfa page, not the overlay |
| Logout → POST /api/auth/logout | **Disconnected** — frontend only clears localStorage, never calls API |
| Logout from Navbar → / | Uses `window.location.href = "/"` — hard nav, loses React state |
| Admin layout → token/role verification | **No guard** — any user can navigate to /admin directly (backend blocks, but frontend renders empty layout) |
| Navbar token check | **One-time on mount** — doesn't update if token changes in another tab |

### Payments & Wallet
| Connection | Status |
|------------|--------|
| POST /api/wallet | **Unused** — neither /wallet nor /wallet/balance is called by any frontend code |
| Deposit success → Notification | **Missing** — no notification created |
| Withdrawal success → Notification | **Missing** — no notification created |
| Money Request → Notification to payer | **Missing** — no notification created |
| QR Payment → Notification to receiver | **Missing** — only sender gets notified |
| Fee display in Transfer/Withdraw UI | **Missing** — fee calculated server-side but never shown to user before confirmation |
| Idempotency keys on Deposit/Request/QR | **Missing** — these modals use raw `fetch()` not `apiFetch` |
| Wallet balance query optimization | **Redundant** — /wallet and /wallet/balance both unused; dashboard uses /auth/me and /dashboard/stats |

### Notifications
| Connection | Status |
|------------|--------|
| `REQUEST` type notification icon | **Defined in frontend** — but no backend code ever creates REQUEST-type notifications |
| `REWARD` type notification icon | **Defined in frontend** — but no backend code ever creates REWARD-type notifications |
| `SYSTEM` type notification icon | **Missing in frontend** — falls to default Bell icon (dispute resolution notifications) |
| `TRANSACTION` type notification icon | **Missing in frontend** — falls to default Bell icon (card refill notifications) |
| Notifications on KYC/Admin/Disputes pages | **Missing** — those pages don't fetch /api/notifications |

### Admin
| Connection | Status |
|------------|--------|
| Admin KYC review | **Missing** — POST /kyc/review endpoint exists but no admin UI page |
| Admin dispute notification | **Missing** — when user opens dispute, no notification is created for admins |
| Admin → Dashboard link | **Missing** — admin sidebar has no "Back to Dashboard" link |
| Admin audit logs date filter | Frontend has a date range filter UI but audit-logs endpoint doesn't accept date params |
| Admin user risk editing | **Missing** — no page to set risk scores on users |

### Merchant
| Connection | Status |
|------------|--------|
| Merchant Transactions page | **Missing** — sidebar links to /merchant/history which doesn't exist |
| Merchant settlement history | **Missing** — no way to view past settlement requests |
| Merchant onboarding | **Missing** — no way for a user to become a merchant from the frontend |

### Cards
| Connection | Status |
|------------|--------|
| Card spending controls | **Missing** — POST /cards/:cardId/limits or similar endpoint doesn't exist |
| Card-to-card transfer | **Missing** — no feature to transfer between two user's cards |

---

## RECOMMENDED REFACTOR PLAN

### Phase 1: Fix Broken Connections (1 day)

1. **Fix QR payment URL** — `qrScannerModal.tsx:79`: change `qr-pay` → `qr-payment`
2. **Create `/merchant/history` page** — simple placeholder or redirect to settlements
3. **Fix logout to call API** — `Navbar.tsx`, `Dashboard.tsx`, admin/merchant layouts: call `POST /api/auth/logout` before clearing tokens
4. **Remove/guard `/test-notifications`** — add auth guard or delete page
5. **Wire resend button on `/verify`** — connect to `POST /auth/verify-token` (same endpoint, resend flow)

### Phase 2: Close Notification Gaps (2 days)

6. **Add missing notifications**:
   - Deposit success → `PAYMENT` type notification
   - Withdrawal success → `PAYMENT` type notification
   - Money request created → `REQUEST` type notification to the payer
   - QR payment → `PAYMENT` type notification to the receiver
   - Dispute created → `SYSTEM` type notification to user + admin alert
7. **Add icon mappings** for `SYSTEM` and `TRANSACTION` notification types in `NotificationTray.tsx`
8. **Fetch notifications** on `/kyc` and `/admin/disputes` pages

### Phase 3: Wire Orphaned Backend Features (3 days)

9. **Admin KYC review page** — new `/admin/kyc` page:
   - List PENDING verifications
   - View uploaded documents
   - Approve/Reject buttons → `POST /api/kyc/review`
10. **Loyalty/coupon frontend** — new `/rewards` page:
    - View available coupons from `GET /api/loyalty/status`
    - Claim coupon via `POST /api/loyalty/claim`
    - Show claimed coupons
11. **Dispute evidence + messaging**:
    - Evidence upload in dispute creation modal
    - Message thread between user and admin per dispute
12. **Forgot password flow**:
    - New backend endpoint: `POST /auth/forgot-password`
    - New backend endpoint: `POST /auth/reset-password`
    - New frontend: `/forgot-password` and `/reset-password` pages

### Phase 4: Fix Inconsistent Patterns (1 week)

13. **Migrate all raw `fetch()` calls to `apiFetch`**:
    - `DepositModal.tsx` — limits + deposit
    - `RequestModal.tsx` — search + request
    - `QRScannerModal.tsx` — search + qr-payment
    - All admin pages (8 files)
    - All merchant pages (4 files)
    - All auth pages (login, register, MFA, verify)
14. **Extract `http://localhost:5000` to `NEXT_PUBLIC_API_URL`** — update `lib/api.ts` + all raw fetch URLs
15. **Add loading/error boundaries** — `loading.tsx` + `error.tsx` in every route segment
16. **Fix authenticate/unauthenticated storage duplication** — sessionStorage is set but never read

---

## DEPENDENCY MAP

```
                                 ┌─────────────────────────────────────────────┐
                                 │                 LANDING PAGE                │
                                 │  static marketing, no auth, no API calls    │
                                 └────────────┬──────────────────┬─────────────┘
                                              │                  │
                                     /register                  /login
                                              │                  │
                                              ▼                  ▼
                                 ┌──────────────────┐  ┌──────────────────┐
                                 │   REGISTER       │  │     LOGIN        │
                                 │  2-step: info    │  │  email + password│
                                 │  + face capture  │  │  POST /auth/login│
                                 └────────┬─────────┘  └────────┬─────────┘
                                          │                     │ (requireMFA=true)
                                          ▼                     ▼
                                 ┌──────────────────┐  ┌──────────────────┐
                                 │    VERIFY        │  │      MFA         │
                                 │  email + phone   │  │ face + code      │
                                 │  POST /verify-   │  │ POST /verify-mfa │
                                 │  token           │  └────────┬─────────┘
                                 └────────┬─────────┘           │ (role check)
                                          │                     │
                                          ▼                     ▼
                                 ┌─────────────────────────────────────────────┐
                                 │               DASHBOARD                     │
                                 │  6 API calls on mount                       │
                                 │  /auth/me, /transactions/recent, /cards     │
                                 │  /transactions/requests, /notifications     │
                                 │  /dashboard/stats                           │
                                 │                                             │
                                 │  Role check: admin → /admin                 │
                                 └─────┬─────┬─────┬──────┬──────┬──────┬──────┘
                                       │     │     │      │      │      │
                  ┌────────────────────┘     │     │      │      │      └──────────────┐
                  ▼                          ▼     ▼      ▼      ▼                     ▼
         ┌────────────────┐       ┌──────────────────────────────────────┐   ┌────────────────┐
         │   PROFILE      │       │       QUICK ACTION MODALS           │   │  TRANSACTIONS  │
         │  /profile      │       │                                      │   │  /transactions │
         │  PATCH /profile│       │  [Send] TransferModal                │   │  dispute flow  │
         │  POST /password│       │  [Receive] RequestModal              │   └────────────────┘
         │  sessions, face│       │  [Pay] QRScannerModal ★BROKEN★      │
         │  KYC link      │       │  [Deposit] DepositModal              │
         └────────┬───────┘       │  [Withdraw] WithdrawModal            │
                  │               └──────────────────────────────────────┘
                  ▼                          │       │       │       │
         ┌────────────────┐                  ▼       ▼       ▼       ▼
         │      KYC       │       ┌──────────────────────────────────────┐
         │  /kyc          │       │         BACKEND SERVICES             │
         │  5-step wizard │       │                                      │
         │  document      │       │  transferService  walletService      │
         │  upload +      │       │  feeService       limitService       │
         │  submission    │       │  riskService      ledgerService      │
         └────────────────┘       │  emailService     notificationCtrl   │
                                  │                                      │
         ┌────────────────┐       │  ┌────────────────────────────────┐  │
         │    CARDS       │       │  │       DATABASE (26 tables)     │  │
         │  /cards        │──────▶│  │  users wallets transactions    │  │
         │  full lifecycle│       │  │  cards tiers kyc_*            │  │
         └────────────────┘       │  │  disputes ledger_* merchants  │  │
                                  │  │  refresh_tokens audit_logs    │  │
                                  │  │  notifications coupons        │  │
                                  │  │  risk_events device_sessions  │  │
                                  │  └────────────────────────────────┘  │
                                  └──────────────────────────────────────┘
                                                  │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    ▼                              ▼                              ▼
         ┌────────────────────┐       ┌────────────────────┐       ┌────────────────────┐
         │      ADMIN         │       │     MERCHANT        │       │   NOTIFICATIONS    │
         │  /admin/*          │       │  /merchant/*        │       │                    │
         │                    │       │                    │       │  Created by:        │
         │  /users            │       │  /dashboard        │       │  transferService    │
         │  /transactions     │       │  /qr               │       │  cardController     │
         │  /disputes         │       │  /settlements      │       │  kycController      │
         │  /ledger           │       │  /history ★404★    │       │  disputeController  │
         │  /audit            │       │                    │       │  adminController    │
         │  /broadcast        │       │  Merchant access   │       │  profileController  │
         │  ★NO KYC REVIEW★  │       │  via merchant_     │       │  transactionCtrl    │
         └────────────────────┘       │  users table       │       └────────────────────┘
                                      └────────────────────┘

LEGEND:
  ★BROKEN★  = flow is actively broken
  ★404★    = URL doesn't exist
  ★MISSING★ = feature not implemented
```

---

## SUMMARY OF ALL JOURNEYS

| Journey | Status | Score |
|---------|--------|-------|
| Visitor → Landing → Register | ✅ Fully Working | 10/10 |
| Visitor → Landing → Login | ✅ Fully Working | 10/10 |
| Register → Verify → Dashboard | ✅ Fully Working | 9/10 (resend button broken) |
| Login → MFA → Dashboard | ✅ Fully Working | 9/10 (face descriptor endpoint unauthenticated) |
| Send Money (P2P Transfer) | ✅ Fully Working | 10/10 |
| Request Money | ⚠️ Partially Working | 6/10 (no notification, raw fetch) |
| Deposit | ⚠️ Partially Working | 7/10 (no notification, raw fetch) |
| Withdraw | ⚠️ Partially Working | 7/10 (no notification) |
| QR Scan & Pay | ❌ Broken | 0/10 (wrong URL → 404) |
| Virtual Cards Lifecycle | ✅ Fully Working | 9/10 (CVV exposed in API) |
| Dispute (Create → Resolve) | ⚠️ Partially Working | 5/10 (no evidence, no messaging, no admin notification) |
| KYC Verification | ⚠️ Partially Working | 6/10 (no admin review page, resubmit bug) |
| Profile Management | ✅ Fully Working | 8/10 (no avatar upload) |
| Admin User Management | ✅ Fully Working | 8/10 (no role change UI) |
| Admin Transaction Review | ⚠️ Partially Working | 7/10 (no search/filter) |
| Admin Dispute Resolution | ⚠️ Partially Working | 6/10 (no evidence viewing, no messaging) |
| Admin Ledger View | ⚠️ Read Only | 5/10 (no journal creation) |
| Admin Broadcast | ✅ Fully Working | 7/10 (no scheduling) |
| Merchant Dashboard | ⚠️ Partially Working | 5/10 (transactions nav broken, no onboarding) |
| Merchant Settlements | ⚠️ Partially Working | 4/10 (no history, broken nav) |
| Loyalty/Rewards | ❌ Orphaned | 0/10 (backend only, no frontend) |
| Forgot Password | ❌ Broken | 0/10 (dead link) |
| Email Notifications | ❌ Broken | 0/10 (SMTP not configured) |
| In-App Notifications | ⚠️ Missing types | 6/10 (REQUEST and REWARD icons unused, SYSTEM+TRANSACTION icons missing) |
