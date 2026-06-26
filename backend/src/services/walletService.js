const db = require('../lib/db');
const walletRepository = require('../repositories/walletRepository');
const transactionRepository = require('../repositories/transactionRepository');
const ledgerService = require('./ledgerService');
const feeService = require('./feeService');
const limitService = require('./limitService');
const conversionService = require('./conversionService');
const { logAudit } = require('../lib/auditLogger');

const walletService = {
    async deposit(userId, amount, currency, method, req) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const wallet = await walletRepository.findByUserIdAndCurrency(userId, currency || 'MAD', connection, true);
            if (!wallet) throw new Error(`${currency || 'MAD'} wallet not found`);

            const feeType = method === 'CARD' ? 'DEPOSIT_CARD' : method === 'MARJANE_STORE' || method === 'CRYPTO' ? 'DEPOSIT_STORE' : 'DEPOSIT_BANK';
            const fee = await feeService.calculateFee(userId, amount, feeType);
            const netAmount = parseFloat(amount) - fee;

            await walletRepository.updateBalance(wallet.id, netAmount, connection);

            const transactionId = await transactionRepository.create({
                senderWalletId: null,
                receiverWalletId: wallet.id,
                amount: netAmount,
                currency: currency || 'MAD',
                type: 'DEPOSIT',
                status: 'COMPLETED',
                note: `Deposit via ${method}${fee > 0 ? ` (fee: ${fee})` : ''}`
            }, connection);

            await ledgerService.recordTransaction(connection, transactionId, [
                { accountId: 'system-bank-account', amount: -netAmount, description: `Deposit intake for user ${userId}` },
                { accountId: wallet.id, amount: netAmount, description: `Deposit via ${method}` },
            ]);
            if (fee > 0) {
                await ledgerService.recordTransaction(connection, transactionId, [
                    { accountId: 'system-bank-account', amount: -fee, description: `Deposit fee intake ${transactionId}` },
                    { accountId: 'system-fees-account', amount: fee, description: `Deposit fee ${feeType}` },
                ]);
            }

            await connection.commit();
            await logAudit(req, 'WALLET_DEPOSIT', 'wallet', null, { amount, currency, method, transactionId });

            return { transactionId };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    },

    async withdraw(userId, amount, currency, method, req, destinationAddress) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const wallet = await walletRepository.findByUserIdAndCurrency(userId, currency || 'MAD', connection, true);
            if (!wallet) throw new Error(`${currency || 'MAD'} wallet not found`);

            const fee = method === 'CRYPTO' ? 0 : await feeService.calculateFee(userId, amount, 'WITHDRAWAL', currency || 'MAD');
            const totalDebit = parseFloat(amount) + fee;

            if (parseFloat(wallet.balance) < totalDebit) {
                throw new Error('Insufficient balance (including fees)');
            }

            if (method !== 'CRYPTO') {
                await limitService.checkLimit(userId, 'withdrawal', totalDebit);
            }
            await walletRepository.updateBalance(wallet.id, -totalDebit, connection);

            const note = method === 'CRYPTO' && destinationAddress
                ? `Crypto withdrawal: ${amount} ${currency} → ${destinationAddress}`
                : `Withdrawal via ${method}${fee > 0 ? ` (Fee: ${fee})` : ''}`;

            const transactionId = await transactionRepository.create({
                senderWalletId: wallet.id,
                receiverWalletId: null,
                amount: parseFloat(amount),
                currency: currency || 'MAD',
                type: 'WITHDRAWAL',
                status: 'COMPLETED',
                note
            }, connection);

            await ledgerService.recordTransaction(connection, transactionId, [
                { accountId: wallet.id, amount: -totalDebit, description: `Withdrawal via ${method} (incl. fee ${fee})` },
                { accountId: 'system-bank-account', amount: parseFloat(amount), description: `Payout for withdrawal ${transactionId}` },
                { accountId: 'system-fees-account', amount: fee, description: `Fee from withdrawal ${transactionId}` }
            ]);

            await connection.commit();
            await logAudit(req, 'WITHDRAWAL', 'wallet', null, { amount, currency, method, transactionId });

            return { transactionId };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    },

    async convertCurrency(userId, amount, fromCurrency, toCurrency, req) {
        return conversionService.convert(userId, amount, fromCurrency, toCurrency, req);
    }
};

module.exports = walletService;
