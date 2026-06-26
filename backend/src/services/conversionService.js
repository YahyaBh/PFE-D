const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const exchangeService = require('./exchangeService');
const feeService = require('./feeService');
const ledgerService = require('./ledgerService');
const walletRepository = require('../repositories/walletRepository');
const transactionRepository = require('../repositories/transactionRepository');
const { logAudit } = require('../lib/auditLogger');

const conversionService = {
    async convert(userId, amount, fromCurrency, toCurrency, req) {
        if (fromCurrency === toCurrency) {
            return { netAmount: parseFloat(amount), fee: 0, rate: 1 };
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const sourceWallet = await walletRepository.findByUserIdAndCurrency(userId, fromCurrency, connection, true);
            if (!sourceWallet) throw new Error(`${fromCurrency} wallet not found`);
            if (parseFloat(sourceWallet.balance) < parseFloat(amount)) {
                throw new Error(`Insufficient ${fromCurrency} balance`);
            }

            const feeType = toCurrency === 'MAD' ? 'CONVERSION_TO_MAD' : 'CONVERSION_FROM_MAD';
            const feePercent = feeService.getFeePercent(feeType);
            const rate = await exchangeService.getRate(fromCurrency, toCurrency);
            const grossAmount = parseFloat(amount);

            const convertedGross = grossAmount * rate;
            const feeAmount = (convertedGross * feePercent) / 100;
            const netAmount = convertedGross - feeAmount;

            const targetWallet = await walletRepository.findByUserIdAndCurrency(userId, toCurrency, connection, true);
            if (!targetWallet) throw new Error(`${toCurrency} wallet not found`);

            await walletRepository.updateBalance(sourceWallet.id, -grossAmount, connection);
            await walletRepository.updateBalance(targetWallet.id, netAmount, connection);

            const transactionId = await transactionRepository.create({
                senderWalletId: sourceWallet.id,
                receiverWalletId: targetWallet.id,
                amount: netAmount,
                currency: toCurrency,
                type: 'CONVERSION',
                status: 'COMPLETED',
                note: `Converted ${grossAmount} ${fromCurrency} → ${netAmount.toFixed(2)} ${toCurrency} (fee: ${feeAmount.toFixed(2)} at ${feePercent}%)`
            }, connection);

            await ledgerService.recordTransaction(connection, transactionId, [
                { accountId: sourceWallet.id, amount: -grossAmount, description: `Conversion out: ${fromCurrency} → ${toCurrency}` },
                { accountId: 'system-forex-escrow', amount: +grossAmount, description: `Escrow: ${fromCurrency} for conversion` }
            ]);

            await ledgerService.recordTransaction(connection, transactionId, [
                { accountId: 'system-forex-escrow', amount: -convertedGross, description: `Release: ${toCurrency} from conversion` },
                { accountId: targetWallet.id, amount: netAmount, description: `Conversion in: ${toCurrency} from ${fromCurrency}` },
                { accountId: 'system-fees-account', amount: feeAmount, description: `Conversion fee ${feeType} (${feePercent}%)` }
            ]);

            await db.query(
                'INSERT INTO currency_conversions (id, user_id, from_currency, to_currency, gross_amount, fee, fee_percent, rate, net_amount, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), userId, fromCurrency, toCurrency, grossAmount, feeAmount, feePercent, rate, netAmount, transactionId]
            );

            await connection.commit();
            await logAudit(req, 'CURRENCY_CONVERSION', 'wallet', null, { fromCurrency, toCurrency, grossAmount, netAmount, feeAmount });

            return { transactionId, netAmount, fee: feeAmount, rate };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
};

module.exports = conversionService;
