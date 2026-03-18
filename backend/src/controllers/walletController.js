const db = require('../lib/db');

const getWallet = async (req, res) => {
  try {
    const [wallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    const wallet = wallets[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      ...wallet,
      balance: parseFloat(wallet.balance)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching wallet' });
  }
};

const getBalance = async (req, res) => {
  try {
    const [wallets] = await db.query('SELECT balance, currency FROM wallets WHERE user_id = ?', [req.user.id]);
    const wallet = wallets[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      balance: parseFloat(wallet.balance),
      currency: wallet.currency
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching balance' });
  }
};

module.exports = {
  getWallet,
  getBalance
};
