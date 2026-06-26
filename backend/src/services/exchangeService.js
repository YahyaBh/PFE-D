const db = require('../lib/db');
const rateService = require('./rateService');

const RATES_CACHE = { rates: null, timestamp: 0 };
const CACHE_TTL = 60000;

const exchangeService = {
    async getRates() {
        const now = Date.now();
        if (RATES_CACHE.rates && now - RATES_CACHE.timestamp < CACHE_TTL) {
            return RATES_CACHE.rates;
        }

        await rateService.fetchAllRates();
        const [rows] = await db.query(
            'SELECT base_currency, target_currency, buy_rate, sell_rate, updated_at, source, last_fetched_at FROM exchange_rates WHERE base_currency = ?',
            ['MAD']
        );

        RATES_CACHE.rates = rows.map(r => ({
            base: r.base_currency,
            target: r.target_currency,
            buy: parseFloat(r.buy_rate),
            sell: parseFloat(r.sell_rate),
            source: r.source,
            updatedAt: r.last_fetched_at || r.updated_at,
        }));
        RATES_CACHE.timestamp = now;

        return RATES_CACHE.rates;
    },

    async getRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return 1;
        const rates = await this.getRates();
        if (fromCurrency === 'MAD') {
            const r = rates.find(rr => rr.target === toCurrency);
            if (!r) throw new Error(`Unsupported currency: ${toCurrency}`);
            return r.buy;
        }
        if (toCurrency === 'MAD') {
            const r = rates.find(rr => rr.target === fromCurrency);
            if (!r) throw new Error(`Unsupported currency: ${fromCurrency}`);
            return 1 / r.sell;
        }
        const fromRate = rates.find(rr => rr.target === fromCurrency);
        const toRate = rates.find(rr => rr.target === toCurrency);
        if (!fromRate || !toRate) throw new Error(`Unsupported pair: ${fromCurrency} → ${toCurrency}`);
        return (1 / fromRate.sell) * toRate.buy;
    },

    async convertToMAD(amount, fromCurrency) {
        if (fromCurrency === 'MAD') return parseFloat(amount);
        const rate = await this.getRate(fromCurrency, 'MAD');
        return parseFloat(amount) * rate;
    },

    async convertFromMAD(amount, toCurrency) {
        if (toCurrency === 'MAD') return parseFloat(amount);
        const rate = await this.getRate('MAD', toCurrency);
        return parseFloat(amount) * rate;
    },

    async seedDefaultRates() {
        const [existing] = await db.query(
            'SELECT COUNT(*) as count FROM exchange_rates WHERE base_currency = ?',
            ['MAD']
        );
        if (existing[0].count > 0) return;

        const { v4: uuidv4 } = require('uuid');
        await db.query(
            `INSERT IGNORE INTO exchange_rates (id, base_currency, target_currency, buy_rate, sell_rate, source) VALUES ?`,
            [
                [
                    [uuidv4(), 'MAD', 'USD', 0.101000, 0.095000, 'seed'],
                    [uuidv4(), 'MAD', 'EUR', 0.093000, 0.088000, 'seed'],
                    [uuidv4(), 'MAD', 'GBP', 0.079000, 0.074000, 'seed'],
                    [uuidv4(), 'MAD', 'BTC', 0.000021, 0.000019, 'seed'],
                    [uuidv4(), 'MAD', 'ETH', 0.000310, 0.000290, 'seed'],
                    [uuidv4(), 'MAD', 'USDT', 0.102000, 0.098000, 'seed'],
                ]
            ]
        );
    }
};

module.exports = exchangeService;
