const FEE_CONFIG = {
    P2P_TRANSFER: 0,
    P2P_CROSS_CURRENCY: 2.5,
    QR_PAYMENT: 0,
    REQUEST: 0,
    DEPOSIT_BANK: 1.0,
    DEPOSIT_CARD: 1.5,
    WITHDRAWAL_MAD: 2.0,
    WITHDRAWAL_EUR: 2.5,
    WITHDRAWAL_USD: 2.5,
    CONVERSION_TO_MAD: 1.5,
    CONVERSION_FROM_MAD: 2.5,
    CARD_REFILL: 0,
    CARD_DOMESTIC: 0,
    DEPOSIT_STORE: 0,
};

const feeService = {
    async calculateFee(userId, amount, transactionType, currency) {
        let key = transactionType;
        if (transactionType === 'WITHDRAWAL' && currency) {
            if (currency === 'EUR') key = 'WITHDRAWAL_EUR';
            else if (currency === 'USD') key = 'WITHDRAWAL_USD';
            else key = 'WITHDRAWAL_MAD';
        }
        const percent = FEE_CONFIG[key];
        if (percent === undefined || percent === 0) return 0;

        const fee = (parseFloat(amount) * percent) / 100;
        return parseFloat(fee.toFixed(2));
    },

    getFeePercent(transactionType, currency) {
        let key = transactionType;
        if (transactionType === 'WITHDRAWAL' && currency) {
            if (currency === 'EUR') key = 'WITHDRAWAL_EUR';
            else if (currency === 'USD') key = 'WITHDRAWAL_USD';
            else key = 'WITHDRAWAL_MAD';
        }
        return FEE_CONFIG[key] ?? 0;
    }
};

module.exports = feeService;
