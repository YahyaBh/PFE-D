# COMPLETE PROJECT AUDIT — Marjane Digital Wallet

**Date:** June 9, 2026
**Scope:** Full-stack monorepo (Express + MySQL backend, Next.js 14 frontend)
**Auditor:** AI Senior Full Stack Developer / Security Engineer / Product Manager

---

## 1. Executive Summary

This is a fintech digital wallet application with **significant architectural ambition** (double-entry ledger, tier-based fees, KYC, QR payments, loyalty rewards, merchant portal, dispute resolution, MFA, Face ID). The codebase has **good structural foundations** but suffers from **inconsistent execution quality**, **critical security vulnerabilities**, and **missing production infrastructure**.

**PROJECT HEALTH SCORE: 44/100**

The app works end-to-end for a basic user registration → login → MFA → dashboard flow. However, it would fail in production due to: an exposed biometric data endpoint, PCI DSS violations (CVV stored in plaintext), MFA codes logged to stdout, a broken QR payment URL, no CI/CD, no error monitoring, no loading/error boundaries, and 20+ hardcoded `localhost:5000` URLs.

---

## 2. Architecture Score: 4/10

| Criterion | Score | Notes |
|-----------|-------|-------|
| Project structure | 6/10 | Clean separation: controllers/services/repositories/routes/middleware |
| Monorepo tooling | 0/10 | No root package.json, no workspaces, no turbo/nx |
| Code reuse | 3/10 | ~43 raw `fetch()` calls bypassing the existing `apiFetch` wrapper |
| Dependency injection | 2/10 | Circular: `notificationController` imported by services, services imported by controllers |
| Configuration management | 2/10 | No env validation at startup, no `.env` for frontend |
| Dead code | 4/10 | Prisma files, `oldWalletController`, duplicate dispute routes, unused modal components |
| Technical debt | 3/10 | Heavy `any` usage, 15+ stale `useEffect` closures, silent `.catch` handlers |
| Scalability | 2/10 | No caching layer, connection pool of 10 with no retry config |

**Key findings:**
- **Circular dependency**: `transferService.js` imports `notificationController.js`, which is a controller, not a service. Controllers should depend on services, not the other way around.
- **Prisma files are dead**: `backend/prisma/` has a schema and seed file, but Prisma is not installed (`@prisma/client` was removed). The only db client is `mysql2`.
- **Old wallet controller alias**: `routes/api.js:8` imports `walletController` as `oldWalletController` but never uses it.
- **Duplicate dispute routes**: `GET /disputes/my` (line 70) and `GET /disputes` (line 127) both map to the same handler. Neither is called by the frontend.
- **Test page is live**: `src/app/test-notifications/page.tsx` is accessible at `/test-notifications` in production.

---

## 3. Frontend Score: 4/10

| Criterion | Score | Notes |
|-----------|-------|-------|
| Component design | 5/10 | Good UI component separation (Wallet/ modals, ui/ primitives) |
| State management | 2/10 | Raw `useState` + `localStorage` everywhere; no React Query/SWR/Zustand |
| TypeScript usage | 3/10 | 28+ `as any` sites; no proper API response types |
| Error handling | 2/10 | 18 silent catch handlers; admin/merchant pages show spinner forever on error |
| Loading states | 3/10 | No `loading.tsx` files; no Suspense boundaries |
| Accessibility | 1/10 | No alt text on icons, no aria labels, no keyboard navigation testing |
| Responsiveness | 5/10 | Tailwind responsive classes used but untested |
| API integration | 2/10 | 20+ files hardcode `http://localhost:5000`; inconsistent use of `apiFetch` |
| Routing | 5/10 | Next.js App Router used correctly but no `loading.tsx`/`error.tsx`/`not-found.tsx` |
| SEO | 1/10 | Only the landing page has metadata; no sitemap, no structured data |

**Key findings:**
- **Broken QR payment**: `QRScannerModal.tsx:79` calls `POST /transactions/qr-pay` but backend has `POST /transactions/qr-payment`. QR payments always 404.
- **No error/loading boundaries**: Zero `loading.tsx` or `error.tsx` files across all 13 route segments.
- **Token refresh bypass**: ~43 raw `fetch()` calls read `localStorage.getItem("token")` directly. If the token expires mid-session, these calls fail silently while the `apiFetch` wrapper would auto-refresh.
- **Stale closures**: `QRScanner.tsx` has `useEffect` with `[]` deps but captures `onScanSuccess`, `onScanError`, `fps`, `qrbox` — these will never update, causing subtle bugs.
- **Admin/merchant error handling is broken**: All admin pages catch with `console.error(err)` only — users see infinite loading spinners when APIs fail.
- **Merchant has a broken link**: The merchant layout sidebar links to `/merchant/history` ("Transactions" nav item), but no `app/merchant/history/page.tsx` exists — clicking it gives a 404.

---

## 4. Backend Score: 6/10

| Criterion | Score | Notes |
|-----------|-------|-------|
| API design | 6/10 | RESTful, consistent naming, proper HTTP methods |
| Controller logic | 6/10 | Good separation, self-healing schema in controllers (mixed concern but pragmatic) |
| Service layer | 7/10 | Well-structured services with transactions, error handling |
| Validation | 5/10 | Custom `validate.js` helper exists, used in ~40% of endpoints |
| Error handling | 4/10 | `err.message` leaked to clients in 4+ controllers |
| Logging | 4/10 | `console.log`/`console.error` only; no structured logging library |
| Rate limiting | 5/10 | Global limiter (100/15min) + sensitive limiter (10/30min) but auth routes exposed |
| File upload | 3/10 | Extension-only validation; no MIME check; no malware scanning |

**Key findings:**
- **14 unused backend routes** (never called by frontend): `/auth/logout`, `/auth/logout-all`, `/wallet`, `/wallet/balance`, `/disputes/my`, `/disputes/message`, `/admin/user/suspend`, `/admin/user/unsuspend`, `/loyalty/status`, `/loyalty/claim`, `/kyc/documents`, `/kyc/review`, `/disputes` (duplicate), `/admin/ledger/entries` (wait - this IS called by admin ledger page)
- **Sensitive auth routes lack dedicated rate limiting**: Login, register, MFA verify, password change only have the global 100/15min limiter — not the 10/30min sensitive limiter.
- **`JWT_REFRESH_SECRET` is dead config**: Declared in `.env` but never referenced in code. All JWTs use `JWT_SECRET`.
- **Transfer service imports notification controller**: `transferService.js` requires `notificationController` — creates a circular-ish dependency pattern.

---

## 5. Database Score: 5/10

| Criterion | Score | Notes |
|-----------|-------|-------|
| Schema design | 6/10 | 26 tables covering core domains, good column types |
| Relationships | 4/10 | Only 11 formal FK constraints out of ~25 needed relationships |
| Indexes | 2/10 | Only 2 explicit indexes (notifications, idempotency_keys) |
| Migration strategy | 3/10 | Self-healing via `ensureColumn`/`ensureTable` — pragmatic but fragile |
| Data integrity | 3/10 | Missing FK constraints on critical relationships (cards.user_id, transactions.wallet_id) |
| Seed data | 5/10 | Demo user and 6 tier levels seeded |

**Missing foreign keys (14 missing):**
- `users.tier_id → tiers.id` (informal only)
- `cards.user_id → users.id`
- `cards.wallet_id → wallets.id`
- `transactions.sender_wallet_id → wallets.id`
- `transactions.receiver_wallet_id → wallets.id`
- `disputes.transaction_id → transactions.id`
- `disputes.user_id → users.id`
- `dispute_messages.dispute_id → disputes.id`
- `dispute_messages.sender_id → users.id`
- `dispute_evidence.dispute_id → disputes.id`
- `merchant_users.merchant_id → merchants.id`
- `merchant_users.user_id → users.id`
- `merchant_wallets.merchant_id → merchants.id`
- `ledger_entries.transaction_id → transactions.id`

**Missing indexes on query-heavy columns:**
- `transactions.sender_wallet_id` (used in all WHERE clauses)
- `transactions.receiver_wallet_id`
- `transactions.created_at` (ORDER BY in every transaction query)
- `transactions.status` (filtered in every query)
- `wallets.user_id` (already UNIQUE so auto-indexed — OK)
- `refresh_tokens.user_id`
- `refresh_tokens.expires_at` (filtered in token refresh)

---

## 6. Security Score: 3/10

| # | Severity | Finding |
|---|----------|---------|
| 1 | **CRITICAL** | `GET /api/auth/user/:userId/face-descriptor` has **no auth middleware** — any unauthenticated client can enumerate users and retrieve Face ID biometric data |
| 2 | **HIGH** | Card CVV stored in `cards` table in plaintext and returned in 3 API responses (issueCard, getCards, regenerateCard) — violates PCI DSS |
| 3 | **HIGH** | MFA codes and verification codes logged to console in plaintext (`authController.js:252-255`, `emailService.js:43`) — exposed in server logs |
| 4 | **MEDIUM** | CORS wide open (`cors()` with no options) — all origins allowed in all environments |
| 5 | **MEDIUM** | File upload validates only file extension, not MIME type or magic bytes |
| 6 | **MEDIUM** | No CSRF protection middleware |
| 7 | **MEDIUM** | Internal error messages (`err.message`) leaked to clients in 4+ controllers |
| 8 | **MEDIUM** | Login route returns `faceDescriptor` before MFA — attacker with password can extract biometric data |
| 9 | **MEDIUM** | Auth routes (login, register, MFA verify) lack `sensitiveLimiter` — brute-force possible |
| 10 | **LOW** | Helmet uses default CSP — no HSTS, no permissions-policy |
| 11 | **LOW** | bcrypt salt rounds = 10 (minimum; 12+ recommended for finance) |
| 12 | **LOW** | `DATABASE_URL` missing validation — crash if malformed |
| 13 | **LOW** | User search via `transactions/search` allows contact info enumeration for any user |
| 14 | **LOW** | Helmet CSP defaults may not match frontend needs if images/scripts hosted externally |

---

## 7. SEO Score: 1/10

| Criterion | Status |
|-----------|--------|
| `<title>` tags | Only on landing page (`Marjane - Digital Wallet`) |
| Meta descriptions | Missing on all pages |
| Open Graph tags | Missing entirely |
| Structured data (JSON-LD) | Not present |
| Sitemap.xml | Not present |
| Robots.txt | Not present |
| Semantic HTML | `<main>`, `<nav>`, `<article>` used in landing page, but missing in dashboard |
| Heading hierarchy | Single `<h1>` on landing; dashboard uses `<h1>` through `<h3>` inconsistently |
| Alt text on images | Missing on `Marjane-logo.png` |
| Performance (Core Web Vitals) | Not measurable — no production build tested |
| Mobile optimization | Tailwind responsive classes present but no mobile testing |
| Canonical URLs | Not set |
| Breadcrumbs | Not implemented |

---

## 8. Performance Score: 2/10

| Issue | Impact |
|-------|--------|
| No client-side caching — every page re-fetches all data on mount | High: dashboard fetches 6 endpoints in parallel on every visit |
| `face-api.js` model files (~5MB) loaded on login page | High: blocks first meaningful paint |
| No React.memo or useMemo on heavy components | Medium: re-renders on every state change |
| All pages are `"use client"` — no server components | High: no SSR/ISR benefits, larger JS bundles |
| No image optimization (`next/image` not used) | Medium: `Marjane-logo.png` served without optimization |
| No bundle analysis performed | High: unknown dead code in bundles |
| Database queries use `SELECT *` in several places | Low: fetches unnecessary columns |
| No Redis/memcached caching layer | High: every API call hits MySQL |
| 20+ console.log statements in frontend code | Low: minor CPU overhead in browser |
| No lazy loading for modals/components | Medium: all wallet modals bundled in dashboard page |

---

## 9. Product Score: 3/10

| Issue | Type | Impact |
|-------|------|--------|
| No terms of service page | Trust | Revenue risk |
| No privacy policy page | Legal | GDPR violation risk |
| No contact/support page | Trust | Conversion risk |
| No pricing/features page | Marketing | Conversion risk |
| No FAQ page | UX | Support burden |
| No forgot password flow | UX | Retention risk |
| QR payment broken (404) | Bug | Revenue leak |
| No email actually sent (SMTP not configured) | Functional | MFA flow broken in production |
| Loyalty/coupon frontend not built | Feature | Revenue leak |
| No transaction feedback on errors | UX | Trust risk |
| No loading states on admin pages | UX | Usability issue |
| Test page accessible (/test-notifications) | Quality | Unprofessional |
| Merchant "Transactions" nav link broken | UX | Navigation failure |
| Password change has no confirmation | UX | Friction |
| No onboarding/welcome flow for new users | UX | Retention risk |
| Face ID only on login — no enrollment flow | UX | Incomplete feature |

---

## 10. Production Readiness Score: 2/10

| Criterion | Status |
|-----------|--------|
| Docker/containerization | **Missing** — no Dockerfile, no docker-compose |
| CI/CD pipeline | **Missing** — no GitHub Actions, no GitLab CI |
| Environment validation | **Partial** — JWT_SECRET checked, DATABASE_URL unchecked |
| Web server config | **Missing** — no nginx/Apache for reverse proxy |
| HTTPS/SSL | **Missing** — not configured |
| Monitoring/alerting | **Missing** — no Sentry, DataDog, or structured logging |
| Error tracking | **Missing** — no error aggregation service |
| Database backup strategy | **Missing** — no backup scripts |
| Health checks | **Minimal** — `/health` endpoint exists but no readiness/liveness |
| Rate limiting | **Partial** — missing on sensitive auth routes |
| CORS for production | **Broken** — wide open, needs origin restriction |
| Environment separation | **Partial** — `.env` has NODE_ENV but no `.env.production` |
| Build optimization | **Missing** — no `next build` optimization configured |
| Load testing | **Missing** — no load testing scripts |
| Documentation | **Missing** — README almost empty, no API docs |

---

## Critical Issues (fix immediately)

1. **Unauthenticated face descriptor endpoint** — `GET /api/auth/user/:userId/face-descriptor` has no auth middleware. Add `auth` to the route.

2. **CVV stored in database and returned in API** — Remove CVV from all API responses and stop storing it (PCI DSS violation).

3. **MFA codes logged to stdout** — Remove `console.log` of MFA/verification codes in `authController.js` and `emailService.js`.

4. **QR payment URL mismatch** — Frontend calls `/transactions/qr-pay`, backend has `/transactions/qr-payment`. Fix the path.

---

## Major Issues (fix this week)

5. **No loading/error boundaries** — Add `loading.tsx` and `error.tsx` to every route segment.

6. **Hardcoded `localhost:5000` in 20+ files** — Extract to `NEXT_PUBLIC_API_URL` in `.env.local`.

7. **Broken merchant navigation** — `/merchant/history` page doesn't exist; create it or fix the link.

8. **CORS wide open** — Restrict to frontend origin in production.

9. **Auth rate limiting** — Add `sensitiveLimiter` to login, register, MFA verify, password change routes.

10. **Error messages leaked to clients** — Sanitize `err.message` before returning to clients.

11. **Missing FK constraints** — Add foreign keys on 14 tables for data integrity.

---

## Medium Issues

12. **Stale closure in QRScanner** — Add proper deps or use refs for callbacks.

13. **Unused `apiFetch` bypassed by 43 raw fetch calls** — Migrate all fetch calls to the centralized API client.

14. **`JWT_REFRESH_SECRET` dead config** — Either use it for refresh tokens or remove from `.env`.

15. **bcrypt salt rounds = 10** — Increase to 12 for financial application.

16. **No CSRF protection** — Add `csurf` or `lusca` middleware.

17. **File upload only checks extension** — Validate MIME type and magic bytes.

18. **`SELECT *` queries fetch password hashes** — Specify columns explicitly.

19. **Circular dependency (service → controller)** — Extract notification logic to a service.

20. **Duplicate dispute routes** — Remove `GET /disputes/my` and the duplicate `GET /disputes`.

---

## Minor Issues

21. **Test page accessible at `/test-notifications`** — Remove before production.

22. **Dual `token` / `accessToken` in verifyMFA response** — Remove the redundant field.

23. **Prisma files are dead code** — Remove `backend/prisma/` directory.

24. **Old wallet controller alias** — Remove unused `oldWalletController` import.

25. **Hardcoded system account IDs** — Move to configuration.

26. **Hardcoded email from addresses** — Make configurable via env.

27. **No `.npmrc`** — Add registry/publish config.

28. **No linting/formatting standards** — Add `.eslintrc` and `.prettierrc`.

---

## Missing Connections

| What | Status |
|------|--------|
| QR payment frontend → backend | **BROKEN** — wrong URL path |
| Merchant "Transactions" nav link | **BROKEN** — points to nonexistent page |
| Loyalty/coupons frontend | **MISSING** — backend endpoints exist but no frontend UI |
| Dispute creation from transaction page | **PARTIAL** — endpoint exists but modal flow incomplete |
| Logout API | **DISCONNECTED** — frontend clears localStorage only, never calls `/auth/logout` |
| Wallet balance endpoint | **UNUSED** — dashboard uses `/dashboard/stats` instead |
| Email service | **BROKEN** — no SMTP configured, falls back to console logging |
| Forgot password | **MISSING** — no frontend page, no backend endpoint |
| User onboarding | **MISSING** — no welcome flow after registration |
| Admin suspend/unsuspend | **UNUSED** — superseded by `/admin/users/status` |
| Loading/error boundaries | **MISSING** — no files exist |
| Face ID enrollment | **INCOMPLETE** — login supports Face ID but no dedicated enrollment UI |
| Server components | **MISSING** — every page is `"use client"` |

---

## Broken Workflows

1. **Scan & Pay** — QR code scanned → `/transactions/search` finds user → user clicked Pay → `POST /transactions/qr-pay` → **404**. Payment never completes.

2. **Merchant navigation** — Click "Transactions" in merchant sidebar → navigates to `/merchant/history` → **404 page**.

3. **Session token expiry** — Token expires → `apiFetch` refreshes token silently → raw `fetch()` calls (43 of them) just get 401 → **silent failure**.

4. **KYC document upload** — User uploads document → `kyc/upload` validates extension only → file saved → **no way to view/download documents** (no serving endpoint).

5. **MFA on production** — User requests MFA → `sendMFACode()` → SMTP not configured → falls through to `console.log` → **user never receives code**.

---

## Security Risks

See Section 6 above. Priority order:
1. Biometric data leak (unauthenticated endpoint) — **exploitable now**
2. CVV plaintext storage — **PCI DSS fine risk**
3. MFA code logging — **credential bypass**
4. Wide-open CORS — **origin confusion attacks**
5. No CSRF — **social engineering risk**
6. Weak rate limiting on auth — **brute-force risk**
7. File upload extension-only validation — **malware upload risk**

---

## SEO Problems

- Only 1 of 13 pages has metadata
- No sitemap, robots.txt, canonical URLs, Open Graph, JSON-LD
- No breadcrumb navigation
- Missing alt text on all images
- All pages client-rendered (no SSR) — crawlers see blank HTML

---

## Revenue/Business Risks

1. **QR payments broken** — direct revenue loss from Scan & Pay feature
2. **Loyalty/coupon frontend missing** — no way for users to claim/use coupons
3. **No SMTP configured** — MFA, transaction alerts, verification all fail silently
4. **No forgot password** — users stuck → support burden → churn
5. **No terms/privacy pages** — legal exposure in regulated fintech industry
6. **CVV stored** — PCI DSS non-compliance fines ($10k-$100k/month)
7. **Test page live** — unprofessional, erodes trust

---

## Recommended Fix Order

### Quick Wins (1 day)
1. Add `auth` middleware to face-descriptor route (1 line)
2. Remove CVV from `getCards` and `issueCard` responses (3 lines)
3. Remove `console.log` of MFA codes (2 lines)
4. Fix QR payment URL in `QRScannerModal.tsx` (`qr-pay` → `qr-payment`)
5. Add `loading.tsx` to root app directory (7 lines)
6. Add `error.tsx` to root app directory (15 lines)
7. Remove `/test-notifications` page
8. Create `/merchant/history/page.tsx` or fix nav link
9. Add `NEXT_PUBLIC_API_URL` env variable and update `lib/api.ts`
10. Remove unused duplicate dispute routes

### High Impact Fixes (1 week)
1. Migrate all 43 raw fetch calls to `apiFetch`
2. Fix CORS configuration for production
3. Add `sensitiveLimiter` to all auth routes
4. Sanitize error messages in all controllers
5. Add proper TypeScript types for all API responses
6. Add error UI to all admin/merchant pages
7. Add missing FK constraints via migration
8. Add missing db indexes (transactions, refresh_tokens)
9. Configure real SMTP or an email service (SendGrid, etc.)
10. Add forgot password flow (frontend + backend)

### Long-Term Improvements
1. Dockerize the application (Dockerfile + docker-compose)
2. Set up CI/CD pipeline (GitHub Actions)
3. Add Redis caching layer for API responses
4. Replace `useEffect`+`fetch` with React Query or SWR
5. Add structured logging (Winston/Pino) + monitoring (Sentry)
6. Rewrite face-api.js approach (too heavy, ~5MB model files)
7. Add server components where possible (non-interactive pages)
8. Implement proper E2E testing (Playwright/Cypress)
9. Add API documentation (Swagger/OpenAPI)
10. SEO overhaul (sitemap, metadata, JSON-LD, SSR)
11. Add terms of service, privacy policy, contact pages
12. Load test the API and optimize database queries

---

## Final Verdict

**PROJECT HEALTH SCORE: 44/100**

| Category | Score |
|----------|-------|
| Architecture | 4/10 |
| Frontend | 4/10 |
| Backend | 6/10 |
| Database | 5/10 |
| Security | 3/10 |
| SEO | 1/10 |
| Performance | 2/10 |
| Product | 3/10 |
| Production Readiness | 2/10 |
| **Weighted Average** | **3.3/10** |

The application has a **solid architectural vision** (tier-based fees, double-entry ledger, self-healing schema) but is **not production-ready**. The critical security vulnerabilities (biometric data leak, CVV storage, MFA code logging) must be fixed before any deployment. The QR payment feature is broken. The frontend has no loading states, no error boundaries, inconsistent API integration, and 20+ hardcoded localhost URLs.

With approximately **5-7 days of focused work**, the application could reach a **70/100** state — functional, secure, and deployable.
