const db = require('../lib/db');
const https = require('https');

const CACHE = { rates: null, timestamp: 0 };
const CACHE_TTL = 900000;

const fetchJSON = (url) => new Promise((resolve, reject) => {
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(new Error(`Failed to parse: ${data.slice(0, 100)}`)); }
        });
    }).on('error', reject);
});

const rateService = {
    async fetchAllRates() {
        const now = Date.now();
        if (CACHE.rates && now - CACHE.timestamp < CACHE_TTL) {
            return CACHE.rates;
        }

        const rates = { base: 'MAD', pairs: [], lastUpdated: new Date().toISOString() };
        let fetchedAny = false;

        try {
            const frankfurter = await fetchJSON('https://api.frankfurter.app/latest?from=EUR&to=MAD');
            if (frankfurter?.rates?.MAD) {
                const eurMad = parseFloat(frankfurter.rates.MAD);
                rates.pairs.push({ target: 'EUR', buy: parseFloat((1 / eurMad).toFixed(6)), sell: parseFloat((1 / eurMad).toFixed(6)), source: 'frankfurter' });
                fetchedAny = true;
            }
        } catch (e) { console.warn('rateService: frankfurter.app failed:', e.message); }

        try {
            const erapi = await fetchJSON('https://v6.exchangerate-api.com/v6/latest/USD');
            if (erapi?.conversion_rates?.MAD) {
                const usdMad = parseFloat(erapi.conversion_rates.MAD);
                rates.pairs.push({ target: 'USD', buy: parseFloat((1 / usdMad).toFixed(6)), sell: parseFloat((1 / usdMad).toFixed(6)), source: 'exchangerate-api' });
                fetchedAny = true;
            }
        } catch (e) { console.warn('rateService: exchangerate-api.com failed:', e.message); }

        try {
            const cg = await fetchJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=mad');
            if (cg?.bitcoin?.mad) {
                const btcMad = cg.bitcoin.mad;
                rates.pairs.push({ target: 'BTC', buy: parseFloat((1 / btcMad).toFixed(12)), sell: parseFloat((1 / btcMad).toFixed(12)), source: 'coingecko' });
            }
            if (cg?.ethereum?.mad) {
                const ethMad = cg.ethereum.mad;
                rates.pairs.push({ target: 'ETH', buy: parseFloat((1 / ethMad).toFixed(12)), sell: parseFloat((1 / ethMad).toFixed(12)), source: 'coingecko' });
            }
            if (cg?.tether?.mad) {
                const usdtMad = cg.tether.mad;
                rates.pairs.push({ target: 'USDT', buy: parseFloat((1 / usdtMad).toFixed(6)), sell: parseFloat((1 / usdtMad).toFixed(6)), source: 'coingecko' });
            }
            if (cg?.bitcoin?.mad || cg?.ethereum?.mad) fetchedAny = true;
        } catch (e) { console.warn('rateService: coingecko.com failed:', e.message); }

        if (fetchedAny) {
            await this.storeRates(rates.pairs);
            CACHE.rates = rates;
            CACHE.timestamp = now;
        } else {
            const existing = await this.getStoredRates();
            if (existing.length > 0) {
                rates.pairs = existing;
                rates.lastUpdated = 'cached';
            }
            CACHE.rates = rates;
            CACHE.timestamp = now;
        }

        return rates;
    },

    async storeRates(pairs) {
        const { v4: uuidv4 } = require('uuid');
        const now = new Date();
        for (const p of pairs) {
            const [existing] = await db.query(
                'SELECT id FROM exchange_rates WHERE base_currency = ? AND target_currency = ?',
                ['MAD', p.target]
            );
            if (existing.length > 0) {
                await db.query(
                    'UPDATE exchange_rates SET buy_rate = ?, sell_rate = ?, source = ?, last_fetched_at = ? WHERE base_currency = ? AND target_currency = ?',
                    [p.buy, p.sell, p.source, now, 'MAD', p.target]
                );
            } else {
                await db.query(
                    'INSERT INTO exchange_rates (id, base_currency, target_currency, buy_rate, sell_rate, source, last_fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [uuidv4(), 'MAD', p.target, p.buy, p.sell, p.source, now]
                );
            }
        }
    },

    async getStoredRates() {
        const [rows] = await db.query(
            'SELECT target_currency, buy_rate, sell_rate, source, last_fetched_at FROM exchange_rates WHERE base_currency = ?',
            ['MAD']
        );
        return rows.map(r => ({
            target: r.target_currency,
            buy: parseFloat(r.buy_rate),
            sell: parseFloat(r.sell_rate),
            source: r.source,
            lastFetched: r.last_fetched_at,
        }));
    }
};

module.exports = rateService;
