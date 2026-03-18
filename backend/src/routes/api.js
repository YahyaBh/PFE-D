const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();
const authController = require('../controllers/authController');
const walletController = require('../controllers/walletController');
const cardController = require('../controllers/cardController');
const transactionController = require('../controllers/transactionController');
const depositController = require('../controllers/depositController');
const dashboardController = require('../controllers/dashboardController');
const merchantController = require('../controllers/merchantController');
const loyaltyController = require('../controllers/loyaltyController');
const profileController = require('../controllers/profileController');
const kycController = require('../controllers/kycController');
const limitController = require('../controllers/limitController');
const adminController = require('../controllers/adminController');
const disputeController = require('../controllers/disputeController');
const { sensitiveLimiter } = require('../middleware/rateLimit');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const merchant = require('../middleware/merchant');

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/verify-mfa', authController.verifyMFA);
router.post('/auth/verify-token', authController.verifyToken);
router.get('/auth/me', auth, authController.getMe);
router.get('/auth/user/:userId/face-descriptor', authController.getFaceDescriptor);

// Protected Wallet Routes
router.get('/wallet', auth, walletController.getWallet);
router.get('/wallet/balance', auth, walletController.getBalance);
router.get('/dashboard/stats', auth, dashboardController.getDashboardStats);

// Protected Card Routes
router.post('/cards/issue', auth, cardController.issueCard);
router.get('/cards', auth, cardController.getCards);
router.patch('/cards/status', auth, cardController.toggleCardStatus);
router.post('/cards/:cardId/regenerate', auth, cardController.regenerateCard);
router.post('/cards/refill', auth, cardController.refillCard);
router.delete('/cards/:cardId', auth, cardController.deleteCard);

// Protected Transaction Routes
router.get('/transactions/search', auth, transactionController.searchUser);
router.post('/transactions/transfer', auth, sensitiveLimiter, transactionController.transferMoney);
router.get('/transactions/recent', auth, transactionController.getRecentTransactions);
router.post('/transactions/request', auth, transactionController.requestMoney);
router.get('/transactions/requests', auth, transactionController.getPendingRequests);
router.post('/transactions/process-request', auth, transactionController.processRequest);
router.post('/transactions/withdraw', auth, sensitiveLimiter, transactionController.withdrawMoney);
router.post('/transactions/qr-pay', auth, transactionController.processQRPayment);
router.get('/transactions/history', auth, transactionController.getTransactionHistory);

// Protected Deposit Routes
router.post('/deposit/process', auth, sensitiveLimiter, depositController.processDeposit);

// Merchant Routes (Public/Internal)
// router.get('/merchants', auth, ...); -- To be implemented if list needed

// Loyalty & Rewards
router.get('/loyalty/status', auth, loyaltyController.getLoyaltyStatus);
router.post('/loyalty/claim', auth, loyaltyController.claimCoupon);

// Notifications
router.get('/notifications', auth, notificationController.getNotifications);
router.patch('/notifications/read-all', auth, notificationController.markAllAsRead);
router.patch('/notifications/:id/read', auth, notificationController.markAsRead);
router.delete('/notifications/:id', auth, notificationController.deleteNotification);

// Profile & Security
router.patch('/profile', auth, profileController.updateProfile);
router.post('/profile/change-password', auth, profileController.changePassword);
router.get('/profile/sessions', auth, profileController.getSessions);
router.post('/profile/logout-all', auth, profileController.logoutAllDevices);
router.get('/profile/face-status', auth, profileController.getFaceAuthStatus);
router.delete('/profile/face-auth', auth, profileController.removeFaceAuth);

// KYC & Identity Verification
router.get('/kyc/status', auth, kycController.getStatus);
router.post('/kyc/upload', auth, kycController.upload.single('document'), kycController.uploadDocument);
router.post('/kyc/submit', auth, kycController.submitVerification);
router.get('/kyc/documents', auth, kycController.getDocuments);
router.post('/kyc/review', auth, kycController.reviewVerification);
router.post('/kyc/auto-verify', auth, kycController.autoVerify);
router.delete('/kyc/documents/:id', auth, kycController.deleteDocument);

// Limits & Rate Controls
router.get('/limits', auth, limitController.getLimits);

// Admin Routes
router.get('/admin/users', auth, admin, adminController.getUsers);
router.post('/admin/users/status', auth, admin, adminController.toggleUserStatus);
router.post('/admin/users/reset-mfa', auth, admin, adminController.resetUserMFA);
router.get('/admin/transactions', auth, admin, adminController.getAllTransactions);
router.post('/admin/transactions/reverse', auth, admin, adminController.reverseTransaction);
router.post('/admin/broadcast', auth, admin, adminController.broadcastNotification);
router.get('/admin/audit-logs', auth, admin, adminController.getAuditLogs);
router.get('/admin/ledger/summary', auth, admin, adminController.getLedgerSummary);
router.get('/admin/ledger/entries', auth, admin, adminController.getLedgerEntries);
router.get('/admin/system/overview', auth, admin, adminController.getSystemOverview);

// --- DISPUTES ---
router.post('/disputes', auth, disputeController.createDispute);
router.get('/disputes', auth, disputeController.getMyDisputes);
router.get('/admin/disputes', auth, admin, disputeController.adminGetAllDisputes);
router.post('/admin/disputes/resolve', auth, admin, disputeController.resolveDispute);

// --- MERCHANT PORTAL ---
router.get('/merchant/stats', auth, merchant, merchantController.getMerchantStats);
router.post('/merchant/settlements', auth, merchant, merchantController.requestSettlement);

module.exports = router;
