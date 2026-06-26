const exchangeService = require('../services/exchangeService');
const rateService = require('../services/rateService');

const exchangeController = {
    async getRates(req, res) {
        try {
            const rates = await exchangeService.getRates();
            res.json({ base: 'MAD', rates, updatedAt: new Date().toISOString() });
        } catch (err) {
            console.error('Error fetching exchange rates:', err);
            res.status(500).json({ error: 'Failed to fetch exchange rates' });
        }
    },

    async getLiveRates(req, res) {
        try {
            await rateService.fetchAllRates();
            const rates = await exchangeService.getRates();
            res.json({ base: 'MAD', rates, updatedAt: new Date().toISOString() });
        } catch (err) {
            console.error('Error fetching live exchange rates:', err);
            res.status(500).json({ error: 'Failed to fetch live exchange rates' });
        }
    },

    async convert(req, res) {
        try {
            const { amount, from, to } = req.body || req.query;
            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }

            if (from === to) {
                return res.json({ amount: amountNum, from, to, rate: 1 });
            }

            const rate = await exchangeService.getRate(from, to);
            const converted = amountNum * rate;

            const decimals = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'XRP'].includes(to) ? 8 : 4;

            res.json({
                amount: parseFloat(converted.toFixed(decimals)),
                from,
                to,
                rate,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            console.error('Error converting currency:', err);
            res.status(500).json({ error: 'Conversion failed' });
        }
    }
};

module.exports = exchangeController;
