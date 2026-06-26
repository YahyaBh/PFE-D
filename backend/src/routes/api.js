const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();
const authController = require('../controllers/authController');
const walletController = require('../controllers/walletController');
const cardController = require('../controllers/cardController');
const oldWalletController = require('../controllers/walletController'); // The old one for other routes if needed
const transactionController = require('../controllers/transactionController');
const dashboardController = require('../controllers/dashboardController');
const merchantController = require('../controllers/merchantController');
const loyaltyController = require('../controllers/loyaltyController');
const profileController = require('../controllers/profileController');
const kycController = require('../controllers/kycController');
const limitController = require('../controllers/limitController');
const adminController = require('../controllers/adminController');
const disputeController = require('../controllers/disputeController');
const transferController = require('../controllers/transferController');
const exchangeController = require('../controllers/exchangeController');
const rateLimit = require('express-rate-limit');
const { apiLimiter, sensitiveLimiter } = require('../middleware/rateLimit');

const faceDescriptorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many face descriptor requests. Try again later.' },
});
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const merchant = require('../middleware/merchant');
const idempotency = require('../middleware/idempotency');
const { validate } = require('../lib/validation');

// Apply global rate limiting to all API routes
router.use(apiLimiter);

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Exchange Rate Routes (public)
router.get('/exchange/rates', exchangeController.getRates);
router.get('/exchange/rates/live', exchangeController.getLiveRates);
router.post('/exchange/convert', validate('exchangeConvert'), exchangeController.convert);

// Auth Routes
router.post('/auth/register', sensitiveLimiter, validate('register'), authController.register);
router.post('/auth/login', sensitiveLimiter, validate('login'), authController.login);
router.post('/admin/login', sensitiveLimiter, validate('login'), adminController.adminLogin);
router.post('/auth/verify-mfa', sensitiveLimiter, authController.verifyMFA);
router.post('/auth/resend-mfa', sensitiveLimiter, authController.resendMFA);
router.post('/auth/verify-token', sensitiveLimiter, authController.verifyToken);
router.post('/auth/resend-verification', sensitiveLimiter, authController.resendVerification);
router.post('/auth/forgot-password', sensitiveLimiter, authController.forgotPassword);
router.post('/auth/reset-password', sensitiveLimiter, authController.resetPassword);
router.post('/auth/refresh', sensitiveLimiter, authController.refreshToken);
router.post('/auth/logout', auth, authController.logout);
router.post('/auth/logout-all', auth, authController.logoutAll);
router.get('/auth/me', auth, authController.getMe);
router.get('/auth/user/:userId/face-descriptor', auth, faceDescriptorLimiter, authController.getFaceDescriptor);

// Protected Wallet Routes
router.get('/wallet', auth, walletController.getWallet);
router.get('/wallet/accounts', auth, walletController.getWallets);
router.get('/wallet/balance', auth, walletController.getBalance);
router.get('/wallet/lookup/:id', auth, walletController.lookupWallet);
router.post('/wallet/convert', auth, validate('exchangeConvert'), walletController.convert);
router.get('/dashboard/stats', auth, dashboardController.getDashboardStats);

// Protected Card Routes
router.post('/cards/issue', auth, validate('cardIssue'), cardController.issueCard);
router.get('/cards', auth, cardController.getCards);
router.patch('/cards/status', auth, cardController.toggleCardStatus);
router.post('/cards/:cardId/regenerate', auth, cardController.regenerateCard);
router.post('/cards/refill', auth, validate('cardRefill'), cardController.refillCard);
router.delete('/cards/:cardId', auth, cardController.deleteCard);

// Protected Transaction Routes
router.get('/transactions/search', auth, transactionController.searchUser);
router.post('/transactions/transfer', auth, sensitiveLimiter, idempotency, validate('transfer'), transferController.handleTransfer);
router.post('/transactions/withdraw', auth, sensitiveLimiter, idempotency, validate('withdraw'), walletController.handleWithdraw);
router.get('/transactions/recent', auth, transactionController.getRecentTransactions);
router.get('/transactions/requests', auth, transactionController.getPendingRequests);
router.post('/transactions/request', auth, transactionController.requestMoney);
router.post('/transactions/process-request', auth, transactionController.processRequest);
router.post('/transactions/qr-payment', auth, transactionController.processQRPayment);
router.get('/transactions/history', auth, transactionController.getTransactionHistory);

// Admin Routes (Nuclear Options)
router.post('/admin/user/suspend', auth, admin, adminController.suspendUser);
router.post('/admin/user/unsuspend', auth, admin, adminController.unsuspendUser);

// Protected Deposit Routes
router.post('/deposit/process', auth, sensitiveLimiter, idempotency, validate('deposit'), walletController.handleDeposit);

// Merchant Routes (Public/Internal)
// router.get('/merchants', auth, ...); -- To be implemented if list needed

// Loyalty & Rewards
router.get('/loyalty/status', auth, loyaltyController.getLoyaltyStatus);
router.post('/loyalty/claim', auth, loyaltyController.claimCoupon);

// Notifications
router.get('/notifications', auth, notificationController.getNotifications);
router.get('/notifications/stream', auth, notificationController.streamNotifications);
router.patch('/notifications/read-all', auth, notificationController.markAllAsRead);
router.patch('/notifications/:id/read', auth, notificationController.markAsRead);
router.delete('/notifications/:id', auth, notificationController.deleteNotification);

// Profile & Security
router.patch('/profile', auth, profileController.updateProfile);
router.post('/profile/change-password', auth, validate('changePassword'), profileController.changePassword);
router.get('/profile/sessions', auth, profileController.getSessions);
router.post('/profile/logout-all', auth, profileController.logoutAllDevices);
router.get('/profile/face-status', auth, profileController.getFaceAuthStatus);
router.delete('/profile/face-auth', auth, profileController.removeFaceAuth);
router.post('/profile/toggle-2fa', auth, profileController.toggle2FA);

// KYC & Identity Verification
router.get('/kyc/status', auth, kycController.getStatus);
router.post('/kyc/upload', auth, kycController.upload.single('document'), kycController.uploadDocument);
router.post('/kyc/submit', auth, kycController.submitVerification);
router.get('/kyc/documents', auth, kycController.getDocuments);
router.post('/kyc/review', auth, admin, kycController.reviewVerification);
router.post('/kyc/auto-verify', auth, kycController.autoVerify);
router.delete('/kyc/documents/:id', auth, kycController.deleteDocument);
router.get('/kyc/documents/:id/file', auth, kycController.getDocumentFile);
router.post('/kyc/reset-status', auth, kycController.resetStatus);

// Limits & Rate Controls
router.get('/limits', auth, limitController.getLimits);

// Admin Routes
router.get('/admin/stats', auth, admin, adminController.getAdminStats);
router.get('/admin/users', auth, admin, adminController.getUsers);
router.get('/admin/users/:id/details', auth, admin, adminController.getUserDetails);
router.post('/admin/users/status', auth, admin, adminController.toggleUserStatus);
router.post('/admin/users/reset-mfa', auth, admin, adminController.resetUserMFA);
router.get('/admin/transactions', auth, admin, adminController.getAllTransactions);
router.post('/admin/transactions/reverse', auth, admin, adminController.reverseTransaction);
router.post('/admin/broadcast', auth, admin, adminController.broadcastNotification);
router.get('/admin/audit-logs', auth, admin, adminController.getAuditLogs);
router.get('/admin/ledger/summary', auth, admin, adminController.getLedgerSummary);
router.get('/admin/ledger/entries', auth, admin, adminController.getLedgerEntries);
router.post('/admin/ledger/reconcile', auth, admin, adminController.reconcileLedger);
router.get('/admin/kyc', auth, admin, adminController.getKycVerifications);
router.post('/admin/kyc/:id/approve', auth, admin, adminController.approveKyc);
router.post('/admin/kyc/:id/reject', auth, admin, adminController.rejectKyc);

// Admin Notifications
router.get('/admin/notifications', auth, admin, notificationController.getNotifications);
router.get('/admin/notifications/stream', auth, admin, notificationController.streamNotifications);
router.patch('/admin/notifications/read-all', auth, admin, notificationController.markAllAsRead);
router.patch('/admin/notifications/:id/read', auth, admin, notificationController.markAsRead);

// --- DISPUTES ---
router.post('/disputes', auth, validate('createDispute'), disputeController.createDispute);
router.get('/disputes', auth, disputeController.getMyDisputes);
router.get('/disputes/:id/messages', auth, disputeController.getMessages);
router.post('/disputes/message', auth, disputeController.addMessage);
router.post('/disputes/:id/evidence', auth, disputeController.uploadEvidence.single('file'), disputeController.uploadEvidenceHandler);
router.get('/disputes/:id/evidence', auth, disputeController.getEvidenceList);
router.get('/disputes/:id/evidence/:evidenceId/file', auth, disputeController.getEvidenceFile);
router.get('/admin/disputes', auth, admin, disputeController.adminGetAllDisputes);
router.post('/admin/disputes/resolve', auth, admin, disputeController.resolveDispute);

// --- MERCHANT PORTAL ---
router.get('/merchant/status', auth, merchantController.getMerchantStatus);
router.get('/merchant/stats', auth, merchant, merchantController.getMerchantStats);
router.get('/merchant/transactions', auth, merchant, merchantController.getMerchantTransactions);
router.get('/merchant/settlements', auth, merchant, merchantController.getSettlements);
router.post('/merchant/settlements', auth, merchant, validate('settlementRequest'), merchantController.requestSettlement);
router.post('/merchant/onboarding', auth, validate('merchantOnboarding'), merchantController.requestOnboarding); // No merchant middleware — open to all auth'd users
router.get('/merchant/qr-lookup', auth, merchantController.qrLookup);
router.get('/merchant/sales-chart', auth, merchant, merchantController.getSalesChart);
router.get('/merchant/latest-sales', auth, merchant, merchantController.getLatestSales);
router.get('/merchant/qr', auth, merchant, merchantController.getQRCode);
router.post('/merchant/qr/generate', auth, merchant, merchantController.generateCustomQR);

// Admin Merchant Management
router.get('/admin/merchant/requests', auth, admin, adminController.getMerchantRequests);
router.get('/admin/merchant/requests/:id', auth, admin, adminController.getMerchantRequestDetail);
router.post('/admin/merchant/approve', auth, admin, validate('adminApproveMerchant'), adminController.approveMerchant);
router.post('/admin/merchant/reject/:id', auth, admin, adminController.rejectMerchant);
router.post('/admin/merchant/complete-settlement', auth, admin, adminController.completeSettlement);

module.exports = router;
