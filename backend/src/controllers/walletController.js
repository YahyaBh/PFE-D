const db = require('../lib/db');
const walletRepository = require('../repositories/walletRepository');
const walletService = require('../services/walletService');
const { validate } = require('../lib/validate');

const walletController = {
    async getWallets(req, res) {
        try {
            const wallets = await walletRepository.findByUserId(req.user.id);
            const mapped = wallets.map(w => ({
                id: w.id,
                balance: parseFloat(w.balance),
                currency: w.currency,
                type: w.type,
                status: w.status,
                label: w.label,
            }));
            res.json({ wallets: mapped });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error fetching wallets' });
        }
    },

    async getWallet(req, res) {
        try {
            const { currency } = req.query;
            if (currency) {
                const wallet = await walletRepository.findByUserIdAndCurrency(req.user.id, currency);
                if (!wallet) return res.status(404).json({ error: `${currency} wallet not found` });
                return res.json({ ...wallet, balance: parseFloat(wallet.balance) });
            }
            const wallets = await walletRepository.findByUserId(req.user.id);
            const madWallet = wallets.find(w => w.currency === 'MAD');
            if (!madWallet) return res.status(404).json({ error: 'Wallet not found' });
            res.json({ ...madWallet, balance: parseFloat(madWallet.balance) });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error fetching wallet' });
        }
    },

    async getBalance(req, res) {
        try {
            const { currency } = req.query;
            if (currency) {
                const wallet = await walletRepository.findByUserIdAndCurrency(req.user.id, currency);
                if (!wallet) return res.status(404).json({ error: `${currency} wallet not found` });
                return res.json({ balance: parseFloat(wallet.balance), currency: wallet.currency, type: wallet.type, status: wallet.status });
            }
            const wallets = await walletRepository.findByUserId(req.user.id);
            const balances = wallets.map(w => ({
                balance: parseFloat(w.balance),
                currency: w.currency,
                type: w.type,
                status: w.status,
            }));
            res.json({ balances });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error fetching balance' });
        }
    },

    async handleDeposit(req, res) {
        const { method, amount, currency } = req.body;
        const userId = req.user.id;

        const check = validate({
            method: { required: true, type: 'string', oneOf: ['BANK_TRANSFER', 'CARD', 'MARJANE_STORE', 'CRYPTO'] },
            amount: { required: true, type: 'number', min: 0.01 }
        }, req.body);
        if (!check.valid) {
            return res.status(400).json({ error: check.errors.join('; ') });
        }

        try {
            const result = await walletService.deposit(userId, amount, currency || 'MAD', method, req);
            res.json({ message: 'Deposit successful', ...result });
        } catch (err) {
            console.error('Deposit Controller Error:', err.message);
            res.status(500).json({ error: err.message || 'Server error during deposit' });
        }
    },

    async handleWithdraw(req, res) {
        const { method, amount, currency, destination } = req.body;
        const userId = req.user.id;

        const check = validate({
            method: { required: true, type: 'string' },
            amount: { required: true, type: 'number', min: 0.01 }
        }, req.body);
        if (!check.valid) {
            return res.status(400).json({ error: check.errors.join('; ') });
        }

        try {
            const result = await walletService.withdraw(userId, amount, currency || 'MAD', method, req, destination);
            res.json({ message: 'Withdrawal successful', ...result });
        } catch (err) {
            console.error('Withdraw Controller Error:', err.message);
            res.status(500).json({ error: err.message || 'Server error during withdrawal' });
        }
    },

    async lookupWallet(req, res) {
        try {
            const { id } = req.params;
            const [rows] = await db.query(
                'SELECT wa.id, wa.currency, wa.type, wa.status, wa.balance, wa.user_id, u.name as userName, u.email as userEmail FROM wallet_accounts wa LEFT JOIN users u ON wa.user_id = u.id WHERE wa.id = ?',
                [id]
            );
            if (rows.length === 0) return res.status(404).json({ error: 'Wallet not found' });

            const wallet = rows[0];
            // Only allow wallet owner or admin to view wallet details
            if (wallet.user_id !== req.user.id && req.user.role !== 'ROLE_ADMIN') {
                return res.status(403).json({ error: 'Access denied. You do not own this wallet.' });
            }

            res.json(wallet);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async convert(req, res) {
        const { amount, fromCurrency, toCurrency } = req.body;
        const userId = req.user.id;

        const check = validate({
            amount: { required: true, type: 'number', min: 0.01 },
            fromCurrency: { required: true, type: 'string' },
            toCurrency: { required: true, type: 'string' }
        }, req.body);
        if (!check.valid) {
            return res.status(400).json({ error: check.errors.join('; ') });
        }

        try {
            const result = await walletService.convertCurrency(userId, amount, fromCurrency, toCurrency, req);
            res.json({ message: 'Conversion successful', ...result });
        } catch (err) {
            console.error('Convert Controller Error:', err.message);
            res.status(500).json({ error: err.message || 'Server error during conversion' });
        }
    }
};

module.exports = walletController;
