# Marjane Wallet API Documentation

## Overview
Base URL: `http://localhost:5000/api`

Authentication: Bearer JWT token via `Authorization: Bearer <token>` header.

## Error Codes
| Code | Meaning |
|------|---------|
| 400 | Validation error — check request body/query |
| 401 | Unauthorized — missing, invalid, or expired JWT |
| 403 | Forbidden — insufficient permissions or account suspended |
| 404 | Resource not found |
| 409 | Conflict — resource already exists |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Rate Limiting
- **General API** (`apiLimiter`): 100 requests per 15 minutes (applied globally).
- **Sensitive operations** (`sensitiveLimiter`): 10 requests per 30 minutes (applied to transfer, withdraw, deposit).
- **Face descriptor** (`faceDescriptorLimiter`): 5 requests per hour.

---

## Authentication

### `POST /auth/register`
Register a new user account. Creates 6 wallet accounts (MAD, EUR, USD fiat + BTC, ETH, USDT crypto vaults).

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+212600000001",
  "faceDescriptor": [0.123, 0.456, ...]
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

---

### `POST /auth/login`
Exchange credentials for MFA challenge. Returns `requireMFA: true` on success. The MFA code is sent via email (simulated in non-production: logged to console).

**Request:**
```json
{
  "email": "demo@marjane.ma",
  "password": "marjane2026"
}
```

**Response (200):**
```json
{
  "message": "Initial login successful",
  "requireMFA": true,
  "email": "demo@marjane.ma",
  "userId": "uuid",
  "faceDescriptor": [0.123, 0.456, ...]
}
```

**Error (400):**
```json
{ "error": "Invalid credentials" }
```

---

### `POST /auth/verify-mfa`
Complete MFA verification. Returns JWT access token (15min expiry) and refresh token (30 day UUID).

**Request:**
```json
{
  "userId": "uuid",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "uuid-refresh-token",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "ROLE_USER",
  "message": "MFA verified successfully"
}
```

**Errors:**
- `404` — User not found
- `400` — MFA code expired / Invalid MFA code

---

### `POST /auth/resend-mfa`
Resend a new MFA code to the user's email.

**Request:**
```json
{ "userId": "uuid" }
```

**Response (200):**
```json
{ "message": "A new MFA code has been sent to your email." }
```

---

### `POST /auth/verify-token`
Verify email or phone verification code (used during registration).

**Request:**
```json
{
  "userId": "uuid",
  "type": "email",
  "code": "ABC123"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully",
  "isEmailVerified": true,
  "isPhoneVerified": false,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "directSignIn": true
}
```

`token` and `directSignIn` are only present when both email and phone are verified.

---

### `POST /auth/resend-verification`
Resend email or phone verification code.

**Request:**
```json
{
  "userId": "uuid",
  "type": "email"
}
```

**Response (200):**
```json
{ "message": "A new verification code has been sent to your email." }
```

---

### `POST /auth/forgot-password`
Request a password reset token. Always returns success to prevent email enumeration.

**Request:**
```json
{ "email": "john@example.com" }
```

**Response (200):**
```json
{ "message": "If that email is registered, a reset link has been sent." }
```

---

### `POST /auth/reset-password`
Reset password using the token received via email.

**Request:**
```json
{
  "token": "uuid-reset-token",
  "password": "newSecurePassword456"
}
```

**Response (200):**
```json
{ "message": "Password has been reset successfully." }
```

---

### `POST /auth/refresh`
Exchange a refresh token for a new access/refresh token pair. Old refresh token is rotated (deleted).

**Request:**
```json
{ "refreshToken": "uuid-refresh-token" }
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "uuid-new-refresh-token"
}
```

---

### `POST /auth/logout`
Revoke a specific refresh token. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{ "refreshToken": "uuid-refresh-token" }
```

**Response (200):**
```json
{ "message": "Logged out" }
```

---

### `POST /auth/logout-all`
Revoke all refresh tokens for the authenticated user. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "Logged out from all devices" }
```

---

### `GET /auth/me`
Get current user's profile with all wallet accounts. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "phone": "+212600000001",
  "role": "ROLE_USER",
  "tier": "BRONZE",
  "loyaltyPoints": 150,
  "isEmailVerified": true,
  "isPhoneVerified": false,
  "twoFactorEnabled": false,
  "createdAt": "2026-01-15T10:30:00.000Z",
  "wallets": [
    {
      "id": "uuid",
      "balance": 1250.00,
      "currency": "MAD",
      "type": "fiat",
      "status": "active",
      "label": "MAD Wallet"
    },
    {
      "id": "uuid",
      "balance": 500.00,
      "currency": "EUR",
      "type": "fiat",
      "status": "active",
      "label": "EUR Wallet"
    },
    {
      "id": "uuid",
      "balance": 0.0032,
      "currency": "BTC",
      "type": "crypto",
      "status": "active",
      "label": "BTC Vault"
    }
  ],
  "wallet": {
    "id": "uuid",
    "balance": 1250.00,
    "currency": "MAD"
  },
  "device": "Mozilla/5.0 ...",
  "lastLogin": "Mon, Jan 15, 2026, 10:30 AM"
}
```

---

### `GET /auth/user/:userId/face-descriptor`
Get face descriptor for a user. Rate limited: 5 requests/hour. Requires authentication (own user or admin).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "faceDescriptor": [0.123, 0.456, -0.789, ...]
}
```

If no face descriptor exists:
```json
{ "faceDescriptor": null }
```

---

## Wallet

### `GET /wallet`
Get the user's primary (MAD) wallet or a specific currency wallet.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `currency` | string | (Optional) Filter by currency code (e.g., `EUR`, `BTC`) |

**Response (200) — specific currency:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "balance": 500.00,
  "currency": "EUR",
  "type": "fiat",
  "status": "active",
  "label": "EUR Wallet"
}
```

**Response (200) — default MAD:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "balance": 1250.00,
  "currency": "MAD",
  "type": "fiat",
  "status": "active",
  "label": "MAD Wallet"
}
```

---

### `GET /wallet/accounts`
Get all wallet accounts for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "wallets": [
    { "id": "uuid", "balance": 1250.00, "currency": "MAD", "type": "fiat", "status": "active", "label": "MAD Wallet" },
    { "id": "uuid", "balance": 500.00, "currency": "EUR", "type": "fiat", "status": "active", "label": "EUR Wallet" },
    { "id": "uuid", "balance": 0.0032, "currency": "BTC", "type": "crypto", "status": "active", "label": "BTC Vault" }
  ]
}
```

---

### `GET /wallet/balance`
Get the balance of all wallets or a specific currency.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `currency` | string | (Optional) Filter by currency code |

**Response (200) — all balances:**
```json
{
  "balances": [
    { "balance": 1250.00, "currency": "MAD", "type": "fiat", "status": "active" },
    { "balance": 500.00, "currency": "EUR", "type": "fiat", "status": "active" },
    { "balance": 0.0032, "currency": "BTC", "type": "crypto", "status": "active" }
  ]
}
```

**Response (200) — single currency:**
```json
{ "balance": 500.00, "currency": "EUR", "type": "fiat", "status": "active" }
```

---

### `GET /wallet/lookup/:id`
Look up a wallet by its ID.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "balance": 1250.00,
  "currency": "MAD",
  "type": "fiat",
  "status": "active",
  "label": "MAD Wallet"
}
```

---

### `POST /wallet/convert`
Convert between wallets (exchange currencies within user's own wallets).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "from": "MAD",
  "to": "EUR",
  "amount": 100
}
```

**Response (200):**
```json
{
  "message": "Conversion successful",
  "from": "MAD",
  "to": "EUR",
  "amount": 100,
  "converted": 9.52,
  "rate": 0.0952
}
```

---

## Dashboard

### `GET /dashboard/stats`
Get aggregated dashboard statistics for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "totalBalance": 1750.00,
  "pendingBalance": 0,
  "monthlySpending": 320.50,
  "rewardsEarned": 150,
  "lastTransaction": {
    "id": "uuid",
    "amount": 50.00,
    "currency": "MAD",
    "type": "P2P_TRANSFER",
    "status": "COMPLETED",
    "created_at": "2026-06-22T14:30:00.000Z"
  },
  "wallets": [
    { "balance": "1250.00", "currency": "MAD" },
    { "balance": "500.00", "currency": "EUR" }
  ]
}
```

---

## Cards

### `POST /cards/issue`
Issue a new virtual card. BRONZE tier users limited to 1 card; Premium tiers (SILVER, GOLD, PLATINUM) unlimited. Requires a MAD wallet.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "cardHolder": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "Virtual card issued successfully",
  "card": {
    "id": "uuid",
    "cardNumber": "4532 1234 5678 9012",
    "cardHolder": "John Doe",
    "expiryDate": "06/29",
    "cvv": "123",
    "status": "ACTIVE",
    "balance": 0
  }
}
```

---

### `GET /cards`
Get all cards for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "cards": [
    {
      "id": "uuid",
      "cardNumber": "4532 **** **** 9012",
      "cardHolder": "John Doe",
      "expiryDate": "06/29",
      "status": "ACTIVE",
      "balance": 500.00,
      "wallet_id": "uuid"
    }
  ]
}
```

---

### `PATCH /cards/status`
Toggle card status between ACTIVE and FROZEN.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "cardId": "uuid"
}
```

**Response (200):**
```json
{ "message": "Card status toggled", "newStatus": "FROZEN" }
```

---

### `POST /cards/:cardId/regenerate`
Regenerate card number, CVV, and expiry date.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Card regenerated successfully",
  "card": {
    "id": "uuid",
    "cardNumber": "4912 9876 5432 1098",
    "cardHolder": "John Doe",
    "expiryDate": "06/29",
    "cvv": "789",
    "status": "ACTIVE"
  }
}
```

---

### `POST /cards/refill`
Refill a card from the user's MAD wallet.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "cardId": "uuid",
  "amount": 200
}
```

**Response (200):**
```json
{
  "message": "Card refilled successfully",
  "newCardBalance": 700.00,
  "newWalletBalance": 1050.00
}
```

---

### `DELETE /cards/:cardId`
Delete (close) a virtual card.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "Card deleted successfully" }
```

---

## Transactions

### `GET /transactions/search`
Search for a user by email or phone (for sending money).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `query` | string | Email or phone of user to find |

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+212600000002"
}
```

**Error (404):**
```json
{ "error": "User not found" }
```

---

### `POST /transactions/transfer`
Send money to another user. Rate limited (10 per 30 min). Uses idempotency key.

**Headers:** `Authorization: Bearer <token>`
**Headers (optional):** `Idempotency-Key: uuid` — prevents duplicate transfers on retry.

**Request:**
```json
{
  "receiverId": "uuid-of-receiver",
  "amount": 100,
  "currency": "MAD"
}
```

**Response (200):**
```json
{
  "message": "Transfer successful",
  "transactionId": "uuid",
  "newBalance": 1150.00
}
```

---

### `POST /transactions/withdraw`
Withdraw funds from wallet. Rate limited (10 per 30 min). Uses idempotency key.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "method": "BANK_TRANSFER",
  "amount": 500,
  "currency": "MAD",
  "destinationAddress": "IBAN or crypto address"
}
```

**Response (200):**
```json
{
  "message": "Withdrawal successful",
  "transactionId": "uuid",
  "newBalance": 750.00
}
```

---

### `GET /transactions/recent`
Get the 20 most recent transactions for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "sender_wallet_id": "uuid",
    "receiver_wallet_id": "uuid",
    "amount": "50.00",
    "currency": "MAD",
    "type": "P2P_TRANSFER",
    "status": "COMPLETED",
    "note": "Dinner split",
    "created_at": "2026-06-22T19:30:00.000Z",
    "senderName": "John Doe",
    "senderEmail": "john@example.com",
    "receiverName": "Jane Smith",
    "receiverEmail": "jane@example.com"
  }
]
```

---

### `GET /transactions/requests`
Get pending money requests where the authenticated user is the potential sender.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "sender_wallet_id": "uuid",
    "receiver_wallet_id": "uuid",
    "amount": "30.00",
    "currency": "MAD",
    "type": "REQUEST",
    "status": "PENDING",
    "note": "For the taxi",
    "created_at": "2026-06-22T18:00:00.000Z",
    "requesterName": "Jane Smith",
    "requesterEmail": "jane@example.com"
  }
]
```

---

### `POST /transactions/request`
Request money from another user.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "recipientId": "uuid-of-payer",
  "amount": 30,
  "note": "For the taxi"
}
```

**Response (200):**
```json
{ "message": "Request sent successfully", "transactionId": "uuid" }
```

---

### `POST /transactions/process-request`
Approve or reject a pending money request.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "requestId": "uuid",
  "action": "APPROVE"
}
```

**Response (200) — approved:**
```json
{ "message": "Request approved and funds transferred" }
```

**Response (200) — rejected:**
```json
{ "message": "Request rejected" }
```

---

### `POST /transactions/qr-payment`
Process a QR code payment.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "receiverId": "uuid-of-receiver",
  "amount": 50
}
```

**Response (200):**
```json
{
  "message": "QR Payment successful",
  "transactionId": "uuid"
}
```

---

### `GET /transactions/history`
Full transaction history with filtering, sorting, and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description | Default |
|-------|------|-------------|---------|
| `page` | integer | Page number | `1` |
| `limit` | integer | Items per page (max 100) | `20` |
| `type` | string | Filter by transaction type | — |
| `status` | string | Filter by status (e.g., `COMPLETED`, `PENDING`) | — |
| `dateFrom` | string | Start date (ISO 8601) | — |
| `dateTo` | string | End date (ISO 8601) | — |
| `minAmount` | number | Minimum amount | — |
| `maxAmount` | number | Maximum amount | — |
| `search` | string | Search by counterparty name/email | — |
| `sortBy` | string | `created_at`, `amount`, `type`, `status` | `created_at` |
| `sortOrder` | string | `ASC` or `DESC` | `DESC` |

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "sender_wallet_id": "uuid",
      "receiver_wallet_id": "uuid",
      "amount": "50.00",
      "currency": "MAD",
      "type": "P2P_TRANSFER",
      "status": "COMPLETED",
      "note": "Dinner split",
      "created_at": "2026-06-22T19:30:00.000Z",
      "senderName": "John Doe",
      "senderEmail": "john@example.com",
      "receiverName": "Jane Smith",
      "receiverEmail": "jane@example.com",
      "direction": "OUT"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 3
}
```

`direction` is `"OUT"` if the user was the sender, `"IN"` if the user was the receiver.

---

## Exchange Rates

### `GET /exchange/rates`
Get current exchange rates (base: MAD).

**Response (200):**
```json
{
  "base": "MAD",
  "rates": {
    "EUR": 0.0952,
    "USD": 0.1035,
    "GBP": 0.0818,
    "BTC": 0.0000032,
    "ETH": 0.000052,
    "USDT": 0.1035
  },
  "updatedAt": "2026-06-23T10:00:00.000Z"
}
```

---

### `GET /exchange/rates/live`
Fetch and return fresh exchange rates.

**Response (200):**
```json
{
  "base": "MAD",
  "rates": {
    "EUR": 0.0951,
    "USD": 0.1033,
    "GBP": 0.0817,
    "BTC": 0.0000031,
    "ETH": 0.000051,
    "USDT": 0.1033
  },
  "updatedAt": "2026-06-23T10:05:00.000Z"
}
```

---

### `POST /exchange/convert`
Convert an amount from one currency to another (rate calculation only, no wallet changes).

**Request:**
```json
{
  "amount": 1000,
  "from": "MAD",
  "to": "EUR"
}
```

**Alternative — query params:**
```
GET /exchange/convert?amount=1000&from=MAD&to=EUR
```

**Response (200):**
```json
{
  "amount": 95.20,
  "from": "MAD",
  "to": "EUR",
  "rate": 0.0952,
  "timestamp": "2026-06-23T10:00:00.000Z"
}
```

---

## Deposit

### `POST /deposit/process`
Process a deposit into the user's wallet. Rate limited (10 per 30 min). Uses idempotency key.

**Headers:** `Authorization: Bearer <token>`
**Headers (optional):** `Idempotency-Key: uuid`

**Request:**
```json
{
  "method": "BANK_TRANSFER",
  "amount": 5000,
  "currency": "MAD"
}
```

**Valid methods:** `BANK_TRANSFER`, `CARD`, `MARJANE_STORE`, `CRYPTO`

**Response (200):**
```json
{
  "message": "Deposit successful",
  "transactionId": "uuid",
  "newBalance": 6250.00,
  "currency": "MAD"
}
```

---

## Notifications

### `GET /notifications`
Get up to 50 most recent notifications for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "SECURITY",
    "title": "Card Issued",
    "message": "A new virtual card for \"John Doe\" has been successfully issued.",
    "is_read": 0,
    "created_at": "2026-06-22T15:00:00.000Z"
  }
]
```

---

### `GET /notifications/stream`
Server-Sent Events (SSE) endpoint that streams unread notification count every 30 seconds.

**Headers:** `Authorization: Bearer <token>`

**Response:** `text/event-stream`
```
event: connected
data: {}

event: unread_count
data: {"count": 3}
```

---

### `PATCH /notifications/:id/read`
Mark a single notification as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "Notification marked as read" }
```

---

### `PATCH /notifications/read-all`
Mark all notifications as read for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "All notifications marked as read" }
```

---

### `DELETE /notifications/:id`
Delete a single notification.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "Notification deleted" }
```

---

## Profile

### `PATCH /profile`
Update user profile (name, phone).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "John Updated",
  "phone": "+212600000099"
}
```

At least one field required.

**Response (200):**
```json
{ "message": "Profile updated successfully" }
```

---

### `POST /profile/change-password`
Change the authenticated user's password.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{ "message": "Password changed successfully" }
```

---

### `GET /profile/sessions`
Get all active device sessions.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "device": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
    "lastLogin": "2026-06-23T09:00:00.000Z"
  }
]
```

---

### `POST /profile/logout-all`
Terminate all device sessions.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "All device sessions have been terminated",
  "sessionsRemoved": 2
}
```

---

### `GET /profile/face-status`
Check if face authentication is enrolled.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "hasFaceAuth": true }
```

---

### `DELETE /profile/face-auth`
Remove face authentication data.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "Face authentication removed successfully" }
```

---

### `POST /profile/toggle-2fa`
Enable or disable two-factor authentication.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{ "enabled": true }
```

**Response (200):**
```json
{ "twoFactorEnabled": true }
```

---

## KYC (Know Your Customer)

### `GET /kyc/status`
Get KYC verification status and uploaded documents.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "verification": {
    "id": "uuid",
    "user_id": "uuid",
    "status": "NOT_SUBMITTED",
    "risk_score": 0,
    "submitted_at": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "created_at": "2026-06-20T12:00:00.000Z"
  },
  "documents": [],
  "reviews": []
}
```

---

### `POST /kyc/upload`
Upload a KYC document. Multipart form data.

**Headers:** `Authorization: Bearer <token>`

**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| `document` | file | File (JPG, PNG, PDF, WEBP; max 10MB) |
| `type` | string | Document type: `GOVERNMENT_ID`, `SELFIE`, `ADDRESS_PROOF` |

**Response (200):**
```json
{
  "message": "Document uploaded successfully",
  "documentId": "uuid"
}
```

---

### `POST /kyc/submit`
Submit KYC verification for review. Requires at least one document uploaded.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "KYC verification submitted for review" }
```

---

### `GET /kyc/documents`
Get all uploaded KYC documents.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "type": "GOVERNMENT_ID",
    "file_name": "passport.jpg",
    "status": "PENDING",
    "created_at": "2026-06-20T12:30:00.000Z"
  }
]
```

---

### `DELETE /kyc/documents/:id`
Delete a specific KYC document.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "Document deleted" }
```

---

### `GET /kyc/documents/:id/file`
Download the actual KYC document file.

**Headers:** `Authorization: Bearer <token>`

**Response:** File stream with appropriate MIME type.

---

### `POST /kyc/reset-status`
Reset KYC verification status to NOT_SUBMITTED.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "KYC status reset to NOT_SUBMITTED" }
```

---

## Limits

### `GET /limits`
Get the authenticated user's current wallet limits and usage.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "limits": {
    "id": "uuid",
    "user_id": "uuid",
    "daily_transfer_limit": "5000.00",
    "monthly_transfer_limit": "50000.00",
    "daily_withdrawal_limit": "10000.00",
    "monthly_withdrawal_limit": "100000.00",
    "daily_deposit_limit": "20000.00",
    "monthly_deposit_limit": "200000.00"
  },
  "usage": {
    "transfer": { "daily": 150.00, "monthly": 2300.00 },
    "withdrawal": { "daily": 0, "monthly": 500.00 },
    "deposit": { "daily": 5000.00, "monthly": 15000.00 }
  }
}
```

Tier-based default limits:
| Tier | Daily Transfer | Monthly Transfer |
|------|---------------|------------------|
| BRONZE | 5,000 MAD | 50,000 MAD |
| SILVER/GOLD/PLATINUM | 25,000 MAD | 250,000 MAD |

---

## Merchant Portal

### `GET /merchant/status`
Check merchant status for the authenticated user (lightweight).

**Headers:** `Authorization: Bearer <token>`

**Response (200) — has merchant:**
```json
{
  "merchant": {
    "id": "uuid",
    "name": "My Store",
    "status": "ACTIVE",
    "category": "RETAIL",
    "created_at": "2026-05-01T10:00:00.000Z",
    "wallet_balance": "15000.00",
    "wallet_currency": "MAD"
  }
}
```

**Response (200) — no merchant:**
```json
{ "merchant": null }
```

---

### `GET /merchant/stats`
Get merchant dashboard statistics. Requires merchant role.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "merchant": {
    "merchant_id": "uuid",
    "merchantName": "My Store",
    "merchantStatus": "ACTIVE",
    "role": "OWNER"
  },
  "wallet": { "balance": 15000.00, "currency": "MAD" },
  "salesAnalytics": [
    {
      "date": "2026-06-22T00:00:00.000Z",
      "volume": "1200.00",
      "count": 15
    }
  ],
  "recentTransactions": [
    {
      "id": "uuid",
      "amount": "50.00",
      "currency": "MAD",
      "status": "COMPLETED",
      "created_at": "2026-06-22T19:30:00.000Z",
      "customerName": "John Doe"
    }
  ]
}
```

---

### `GET /merchant/transactions`
Get merchant transaction history. Requires merchant role.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "amount": "50.00",
    "currency": "MAD",
    "type": "P2P_TRANSFER",
    "status": "COMPLETED",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "created_at": "2026-06-22T19:30:00.000Z"
  }
]
```

---

### `GET /merchant/settlements`
Get settlement history. Requires merchant role.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "merchant_id": "uuid",
    "amount": "5000.00",
    "bank_info": "{\"bank\": \"Attijariwafa\", \"account\": \"123456789\"}",
    "status": "COMPLETED",
    "created_at": "2026-06-15T10:00:00.000Z"
  }
]
```

---

### `POST /merchant/settlements`
Request a settlement (payout from merchant wallet to bank). Requires merchant role.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "amount": 5000,
  "bankInfo": {
    "bank": "Attijariwafa",
    "account": "123456789"
  }
}
```

**Response (200):**
```json
{
  "message": "Settlement request submitted successfully",
  "settlementId": "uuid"
}
```

---

### `POST /merchant/onboarding`
Submit a merchant onboarding application.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "My Store",
  "description": "A retail store in Casablanca",
  "category": "RETAIL"
}
```

**Response (200):**
```json
{
  "message": "Your merchant application has been submitted for review.",
  "merchantId": "uuid"
}
```

---

### `GET /merchant/qr-lookup`
Look up a merchant by ID for QR payments.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `merchantId` | string | The merchant ID to look up |

**Response (200):**
```json
{
  "businessName": "My Store",
  "ownerId": "uuid"
}
```

---

## Admin Routes

All admin routes require `Authorization: Bearer <token>` and admin role.

### `GET /admin/users`
Get all registered users.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+212600000001",
    "role": "ROLE_USER",
    "status": "active",
    "tier": "BRONZE",
    "loyalty_points": 150,
    "created_at": "2026-01-15T10:30:00.000Z"
  }
]
```

---

### `POST /admin/users/status`
Toggle user account status (active/suspended).

**Request:**
```json
{
  "userId": "uuid",
  "status": "suspended"
}
```

**Response (200):**
```json
{ "message": "User account suspended successfully" }
```

---

### `POST /admin/users/reset-mfa`
Reset a user's MFA code.

**Request:**
```json
{ "userId": "uuid" }
```

**Response (200):**
```json
{ "message": "MFA reset successfully" }
```

---

### `POST /admin/user/suspend`
Immediately suspend a user and invalidate all sessions.

**Request:**
```json
{
  "userId": "uuid",
  "reason": "Fraudulent activity detected"
}
```

**Response (200):**
```json
{ "message": "User suspended and sessions invalidated" }
```

---

### `POST /admin/user/unsuspend`
Reactivate a suspended user account.

**Request:**
```json
{ "userId": "uuid" }
```

**Response (200):**
```json
{ "message": "User account reactivated" }
```

---

### `GET /admin/transactions`
Get all transactions across the system.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "sender_wallet_id": "uuid",
    "receiver_wallet_id": "uuid",
    "amount": "50.00",
    "currency": "MAD",
    "type": "P2P_TRANSFER",
    "status": "COMPLETED",
    "sender_name": "John Doe",
    "receiver_name": "Jane Smith",
    "created_at": "2026-06-22T19:30:00.000Z"
  }
]
```

---

### `POST /admin/transactions/reverse`
Reverse a P2P transfer transaction.

**Request:**
```json
{ "transactionId": "uuid" }
```

**Response (200):**
```json
{ "message": "Transaction reversed successfully" }
```

---

### `POST /admin/broadcast`
Send a broadcast notification to all users.

**Request:**
```json
{
  "title": "System Maintenance",
  "message": "The system will be down for maintenance at 2:00 AM.",
  "type": "SYSTEM_ANNOUNCEMENT"
}
```

**Response (200):**
```json
{ "message": "Broadcast sent to 150 users" }
```

---

### `GET /admin/audit-logs`
Get audit logs with optional filtering.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `userId` | string | Filter by user ID |
| `action` | string | Filter by action type (e.g., `LOGIN_SUCCESS`) |
| `limit` | integer | Max results (default 50) |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "action": "LOGIN_SUCCESS",
    "resource": "auth",
    "details": null,
    "metadata": null,
    "created_at": "2026-06-23T09:00:00.000Z",
    "userName": "John Doe",
    "userEmail": "john@example.com"
  }
]
```

---

### `GET /admin/ledger/summary`
Get ledger summary with account balances.

**Response (200):**
```json
{
  "stats": {
    "totalCredits": "1500000.00",
    "totalDebits": "1498000.00",
    "imbalance": "2000.00"
  },
  "accounts": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "name": "MAD Wallet - User uuid",
      "type": "LIABILITY",
      "balance": "1250.00",
      "currency": "MAD",
      "ownerName": "John Doe",
      "ownerEmail": "john@example.com"
    }
  ]
}
```

---

### `GET /admin/ledger/entries`
Get individual ledger entries.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `accountId` | string | Filter by account ID |
| `limit` | integer | Max results (default 100) |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "account_id": "uuid",
    "transaction_id": "uuid",
    "amount": "100.00",
    "description": "P2P Transfer",
    "created_at": "2026-06-22T19:30:00.000Z",
    "accountName": "MAD Wallet - User uuid",
    "txType": "P2P_TRANSFER",
    "txStatus": "COMPLETED"
  }
]
```

---

### `GET /admin/system/overview`
Get system-wide metrics and health overview.

**Response (200):**
```json
{
  "stats": {
    "totalUsers": 150,
    "dailyVolume": 45000.00,
    "activeNow": 23,
    "pendingKYC": 5
  },
  "recentActivity": [
    {
      "action": "LOGIN_SUCCESS",
      "resource": "auth",
      "created_at": "2026-06-23T09:30:00.000Z",
      "userName": "John Doe",
      "userEmail": "john@example.com"
    }
  ],
  "health": {
    "database": "Healthy",
    "apiGateway": "Active",
    "kycProcessor": "Active",
    "ledgerEngine": "Synchronized",
    "uptime": "99.98%"
  }
}
```

---

### `GET /admin/kyc`
Get all KYC verifications for admin review.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "status": "PENDING",
    "risk_score": 85,
    "submitted_at": "2026-06-22T14:00:00.000Z",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "docCount": 2
  }
]
```

---

### `POST /kyc/review`
Review and approve/reject a KYC verification. Requires admin.

**Request:**
```json
{
  "verificationId": "uuid",
  "action": "APPROVED",
  "note": "All documents look valid"
}
```

**Response (200):**
```json
{ "message": "KYC reviewed successfully" }
```

---

### `POST /kyc/auto-verify`
Trigger auto-verification of KYC documents. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "Auto-verification completed" }
```

---

### `GET /admin/merchant/requests`
Get all merchant onboarding requests.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "businessName": "My Store",
    "description": "A retail store in Casablanca",
    "category": "RETAIL",
    "status": "PENDING_APPROVAL",
    "created_at": "2026-06-20T10:00:00.000Z",
    "ownerName": "John Doe",
    "ownerEmail": "john@example.com"
  }
]
```

---

### `POST /admin/merchant/approve`
Approve or reject a merchant application.

**Request:**
```json
{
  "merchantId": "uuid",
  "action": "APPROVED"
}
```

**Response (200):**
```json
{ "message": "Merchant request approved successfully" }
```

---

### `POST /admin/merchant/complete-settlement`
Mark a merchant settlement as completed.

**Request:**
```json
{ "settlementId": "uuid" }
```

**Response (200):**
```json
{ "message": "Settlement completed successfully" }
```

---

## Disputes

### `POST /disputes`
Create a new dispute for a transaction.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "transactionId": "uuid",
  "reason": "UNAUTHORIZED",
  "description": "I did not authorize this payment of 500 MAD."
}
```

**Response (200):**
```json
{ "message": "Dispute submitted successfully", "disputeId": "uuid" }
```

---

### `GET /disputes`
Get all disputes for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "transaction_id": "uuid",
    "user_id": "uuid",
    "reason": "UNAUTHORIZED",
    "description": "I did not authorize this payment.",
    "status": "OPEN",
    "created_at": "2026-06-22T20:00:00.000Z",
    "updated_at": null,
    "amount": "500.00",
    "currency": "MAD",
    "txType": "P2P_TRANSFER"
  }
]
```

---

### `GET /disputes/:id/messages`
Get all messages for a specific dispute.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "dispute_id": "uuid",
    "sender_id": "uuid",
    "message": "I need a refund please.",
    "is_admin_reply": 0,
    "created_at": "2026-06-22T20:05:00.000Z",
    "senderName": "John Doe"
  }
]
```

---

### `POST /disputes/message`
Add a message to a dispute.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "disputeId": "uuid",
  "message": "Here are more details about the transaction."
}
```

**Response (200):**
```json
{ "message": "Message sent", "messageId": "uuid" }
```

---

### `POST /disputes/:id/evidence`
Upload evidence file for a dispute. Multipart form data.

**Headers:** `Authorization: Bearer <token>`

**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Evidence file (JPG, PNG, PDF, WEBP, MP4, MOV; max 10MB) |

**Response (200):**
```json
{ "message": "Evidence uploaded", "evidenceId": "uuid" }
```

---

### `GET /disputes/:id/evidence`
Get list of evidence files for a dispute.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "file_type": "jpg",
    "created_at": "2026-06-22T20:10:00.000Z"
  }
]
```

---

### `GET /disputes/:id/evidence/:evidenceId/file`
Download a specific evidence file.

**Headers:** `Authorization: Bearer <token>`

**Response:** File stream with appropriate MIME type.

---

### `GET /admin/disputes`
Get all disputes across the system. Requires admin.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "transaction_id": "uuid",
    "user_id": "uuid",
    "reason": "UNAUTHORIZED",
    "status": "OPEN",
    "amount": "500.00",
    "currency": "MAD",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "created_at": "2026-06-22T20:00:00.000Z"
  }
]
```

---

### `POST /admin/disputes/resolve`
Resolve a dispute (admin only). Status can be `RESOLVED` (refund issued) or `REJECTED`.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "disputeId": "uuid",
  "status": "RESOLVED",
  "resolutionNote": "Refund processed as requested."
}
```

**Response (200):**
```json
{ "message": "Dispute resolved successfully" }
```

---

## Loyalty

### `GET /loyalty/status`
Get the authenticated user's loyalty status, points, and available coupons.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "points": 150,
  "tier": "BRONZE",
  "availableCoupons": [
    {
      "id": "uuid",
      "code": "LOYAL10",
      "description": "10% off your next purchase",
      "discount_percentage": "10.00",
      "points_cost": 100,
      "expiry_date": "2026-12-31T23:59:59.000Z"
    }
  ],
  "myCoupons": [
    {
      "id": "uuid",
      "coupon_id": "uuid",
      "code": "LOYAL10",
      "discount_percentage": "10.00",
      "is_used": false
    }
  ]
}
```

---

### `POST /loyalty/claim`
Claim a coupon using loyalty points.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{ "couponId": "uuid" }
```

**Response (200):**
```json
{
  "message": "Coupon claimed successfully",
  "userCouponId": "uuid"
}
```

**Error (400):**
```json
{ "error": "Insufficient loyalty points" }
```

---

## Health Check

### `GET /health`
Simple health check endpoint (no authentication required).

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2026-06-23T10:00:00.000Z"
}
```
