const db = require('../lib/db');
const walletRepository = require('../repositories/walletRepository');
const transactionRepository = require('../repositories/transactionRepository');
const userRepository = require('../repositories/userRepository');
const notificationController = require('../controllers/notificationController');
const limitService = require('./limitService');
const ledgerService = require('./ledgerService');
const feeService = require('./feeService');
const exchangeService = require('./exchangeService');
const riskService = require('./riskService');
const emailService = require('./emailService');
const { logAudit } = require('../lib/auditLogger');

const transferService = {
    async executeTransfer(senderId, receiverId, amount, currency, req) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const senderWallet = await walletRepository.findByUserIdAndCurrency(senderId, currency || 'MAD', connection, true);
            const receiverWallets = await walletRepository.findByUserId(receiverId, connection, true);

            if (!senderWallet) throw new Error(`Sender ${currency || 'MAD'} wallet not found`);

            const receiverCurrency = currency || 'MAD';
            const receiverWallet = receiverWallets.find(w => w.currency === receiverCurrency)
                || receiverWallets.find(w => w.currency === 'MAD');
            if (!receiverWallet) throw new Error('Receiver wallet not found');

            const sameCurrency = senderWallet.currency === receiverWallet.currency;

            const p2pFee = await feeService.calculateFee(
                senderId, parseFloat(amount),
                sameCurrency ? 'P2P_TRANSFER' : 'P2P_CROSS_CURRENCY'
            );
            const totalDebit = parseFloat(amount) + p2pFee;

            await riskService.checkVelocity(senderId);
            await riskService.checkAmount(senderId, parseFloat(amount));

            if (parseFloat(senderWallet.balance) < totalDebit) {
                throw new Error('Insufficient balance (including fees)');
            }

            await limitService.checkLimit(senderId, 'transfer', totalDebit);

            let receiverAmount = parseFloat(amount);
            let conversionNote = '';

            if (!sameCurrency) {
                const rate = await exchangeService.getRate(senderWallet.currency, receiverWallet.currency);
                receiverAmount = parseFloat((parseFloat(amount) * rate).toFixed(2));
                conversionNote = ` (converted at ${rate.toFixed(6)}: ${amount} ${senderWallet.currency} → ${receiverAmount.toFixed(2)} ${receiverWallet.currency})`;
            }

            await walletRepository.updateBalance(senderWallet.id, -totalDebit, connection);
            await walletRepository.updateBalance(receiverWallet.id, receiverAmount, connection);

            const transactionId = await transactionRepository.create({
                senderWalletId: senderWallet.id,
                receiverWalletId: receiverWallet.id,
                amount: receiverAmount,
                currency: receiverWallet.currency,
                type: 'P2P_TRANSFER',
                status: 'COMPLETED',
                note: `P2P transfer${conversionNote}${p2pFee > 0 ? ` (cross-currency fee: ${p2pFee})` : ''}`
            }, connection);

            const entries = [
                { accountId: senderWallet.id, amount: -totalDebit, description: `Transfer to ${receiverId} (incl. fees)` },
                { accountId: receiverWallet.id, amount: receiverAmount, description: `Transfer from ${senderId}` },
            ];
            if (p2pFee > 0) {
                entries.push({ accountId: 'system-fees-account', amount: p2pFee, description: `P2P fee from transfer ${transactionId}` });
            }
            await ledgerService.recordTransaction(connection, transactionId, entries);

            const pointsEarned = Math.floor(parseFloat(amount) / 100);
            if (pointsEarned > 0) {
                await userRepository.updateLoyaltyPoints(senderId, pointsEarned, connection);
            }

            await connection.commit();

            const [senders] = await db.query('SELECT email FROM users WHERE id = ?', [senderId]);
            const [receivers] = await db.query('SELECT name FROM users WHERE id = ?', [receiverId]);

            await notificationController.createNotification(senderId, 'PAYMENT', 'Money Sent',
                `Sent ${amount} ${senderWallet.currency} to ${receivers[0]?.name || 'user'}`);
            await notificationController.createNotification(receiverId, 'PAYMENT', 'Money Received',
                `Received ${receiverAmount.toFixed(2)} ${receiverWallet.currency} from ${senders[0]?.email || 'user'}`);

            if (senders[0]?.email) {
                await emailService.sendTransactionAlert(senders[0].email, parseFloat(amount), 'TRANSFER', receivers[0]?.name || 'Unknown');
            }

            await logAudit(req, 'WALLET_TRANSFER', 'wallet', null, { amount: parseFloat(amount), currency, transactionId });

            return { transactionId };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
};

module.exports = transferService;
