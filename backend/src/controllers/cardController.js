const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notificationController');
const { logAudit } = require('../lib/auditLogger');
const ledgerService = require('../services/ledgerService');

const generateCardNumber = () => {
    // Generate a random 16-digit card number (starting with 4 for Visa simulation)
    let number = '4';
    for (let i = 0; i < 15; i++) {
        number += Math.floor(Math.random() * 10);
    }
    // Add spaces for formatting
    return number.replace(/(\d{4})/g, '$1 ').trim();
};

const generateCVV = () => {
    return Math.floor(100 + Math.random() * 900).toString();
};

const generateExpiryDate = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear() + 3).slice(-2); // Valid for 3 years
    return `${month}/${year}`;
};

const issueCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardHolder } = req.body;

        // 1. Check user tier and limits
        const [users] = await db.query('SELECT tier FROM users WHERE id = ?', [userId]);
        const userTier = users[0]?.tier || 'BRONZE';

        if (userTier === 'BRONZE') {
            const [existingCards] = await db.query('SELECT COUNT(*) as count FROM cards WHERE user_id = ?', [userId]);
            if (existingCards[0].count >= 1) {
                return res.status(403).json({ 
                    error: 'Card limit reached for Free Tier. Please upgrade to Premium for unlimited cards.' 
                });
            }
        }

        // DB ALIGNMENT SELF-HEALING
        try {
            await db.query("ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id VARCHAR(36)");
            await db.query("ALTER TABLE cards ADD COLUMN IF NOT EXISTS wallet_id VARCHAR(36)");
            await db.query("ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_number VARCHAR(20)");
            await db.query("ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_holder VARCHAR(100)");
            await db.query("ALTER TABLE cards ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0.00");
        } catch(e) {}

        // 2. Fetch user's primary wallet ID
        const [wallets] = await db.query('SELECT id FROM wallets WHERE user_id = ? LIMIT 1', [userId]);
        const walletId = wallets[0]?.id;

        if (!walletId) {
            return res.status(404).json({ error: 'Wallet not found for card issuance.' });
        }

        const cardId = uuidv4();
        const cardNumber = generateCardNumber();
        const cvv = generateCVV();
        const expiryDate = generateExpiryDate();

        await db.query(
            'INSERT INTO cards (id, wallet_id, user_id, card_number, card_holder, expiry_date, cvv, status, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [cardId, walletId, userId, cardNumber, cardHolder || 'Marjane Digital', expiryDate, cvv, 'ACTIVE', 0]
        );

        // TRIGGER NOTIFICATION
        await notificationController.createNotification(
            userId,
            'SECURITY',
            'Card Issued',
            `A new virtual card for "${cardHolder || 'Marjane Digital'}" has been successfully issued.`
        );

        await logAudit(req, 'CARD_ISSUED', 'card', null, { cardId, cardHolder }, userId);

        res.status(201).json({
            message: 'Virtual card issued successfully',
            card: {
                id: cardId,
                cardNumber,
                cvv,
                expiryDate,
                cardHolder: cardHolder || 'Marjane Digital',
                status: 'ACTIVE'
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during card issuance' });
    }
};

const getCards = async (req, res) => {
    try {
        const userId = req.user.id;
        const [cards] = await db.query(
            'SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        // Transform for frontend
        res.json(cards.map(c => ({
            id: c.id,
            cardNumber: c.card_number,
            cardHolder: c.card_holder,
            expiryDate: c.expiry_date,
            cvv: c.cvv,
            status: c.status,
            balance: parseFloat(c.balance) || 0
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching cards' });
    }
};

const toggleCardStatus = async (req, res) => {
    try {
        const { cardId, status } = req.body;
        const userId = req.user.id;

        // Verify ownership
        const [cards] = await db.query(
            'SELECT id FROM cards WHERE id = ? AND user_id = ?',
            [cardId, userId]
        );

        if (cards.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }

        await db.query(
            'UPDATE cards SET status = ? WHERE id = ?',
            [status, cardId]
        );

        // TRIGGER NOTIFICATION
        await notificationController.createNotification(
            userId,
            'SECURITY',
            `Card ${status === 'ACTIVE' ? 'Unfrozen' : 'Frozen'}`,
            `Your virtual card has been marked as ${status.toLowerCase()}.`
        );

        await logAudit(req, status === 'ACTIVE' ? 'CARD_UNFROZEN' : 'CARD_FROZEN', 'card', null, { cardId }, userId);

        res.json({ message: `Card ${status.toLowerCase()} successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating card status' });
    }
};

const deleteCard = async (req, res) => {
    try {
        const { cardId } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const [cards] = await db.query(
            'SELECT id FROM cards WHERE id = ? AND user_id = ?',
            [cardId, userId]
        );

        if (cards.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }

        await db.query('DELETE FROM cards WHERE id = ?', [cardId]);

        res.json({ message: 'Card deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during card deletion' });
    }
};

const regenerateCard = async (req, res) => {
    try {
        const { cardId } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const [cards] = await db.query(
            'SELECT card_holder FROM cards WHERE id = ? AND user_id = ?',
            [cardId, userId]
        );

        if (cards.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }

        const cardHolder = cards[0].card_holder;
        const newCardNumber = generateCardNumber();
        const newCVV = generateCVV();

        await db.query(
            'UPDATE cards SET card_number = ?, cvv = ? WHERE id = ?',
            [newCardNumber, newCVV, cardId]
        );

        // TRIGGER NOTIFICATION
        await notificationController.createNotification(
            userId,
            'SECURITY',
            'Card Details Refreshed',
            `Your details for "${cardHolder}" have been regenerated successfully.`
        );

        res.json({
            message: 'Card details regenerated successfully',
            cardNumber: newCardNumber,
            cvv: newCVV
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during card regeneration' });
    }
};

const refillCard = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const userId = req.user.id;
        const { cardId, amount } = req.body;
        const amountNum = parseFloat(amount);

        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        await connection.beginTransaction();

        // 1. Get card and primary wallet
        const [cards] = await connection.query('SELECT * FROM cards WHERE id = ? AND user_id = ?', [cardId, userId]);
        if (cards.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Card not found' });
        }

        const [wallets] = await connection.query('SELECT * FROM wallets WHERE user_id = ? AND currency = "MAD" LIMIT 1', [userId]);
        const wallet = wallets[0];

        if (!wallet) {
            await connection.rollback();
            return res.status(404).json({ error: 'Primary wallet (MAD) not found' });
        }

        if (parseFloat(wallet.balance) < amountNum) {
            await connection.rollback();
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }

        // 2. Perform transfer
        await connection.query('UPDATE wallets SET balance = balance - ? WHERE id = ?', [amountNum, wallet.id]);
        await connection.query('UPDATE cards SET balance = balance + ? WHERE id = ?', [amountNum, cardId]);

        // 3. Log transaction
        const txId = uuidv4();
        await connection.query(
            'INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [txId, wallet.id, null, amountNum, 'MAD', 'CARD_REFILL', 'COMPLETED', `Refill for card ${cards[0].card_number.slice(-4)}`]
        );

        // LEDGER: Debit Wallet (-), Credit Card Ledger (+)
        // We use cardId as the ledger account ID for the card
        await ledgerService.getOrCreateWalletAccount(connection, cardId, userId, `Virtual Card ${cards[0].card_number.slice(-4)}`);
        
        await ledgerService.recordTransaction(connection, txId, [
            { accountId: wallet.id, amount: -amountNum, description: `Card Refill Out` },
            { accountId: cardId, amount: amountNum, description: `Card Refill In` }
        ]);

        // 4. Notification
        await notificationController.createNotification(
            userId,
            'TRANSACTION',
            'Card Refilled',
            `Successfully transferred ${amountNum} MAD from your wallet to virtual card ending in ${cards[0].card_number.slice(-4)}.`
        );

        await connection.commit();
        await logAudit(req, 'CARD_REFILL', 'card', null, { cardId, amount: amountNum }, userId);

        res.json({ message: 'Card refilled successfully', newBalance: parseFloat(cards[0].balance) + amountNum });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error during card refill' });
    } finally {
        connection.release();
    }
};

module.exports = {
    issueCard,
    getCards,
    toggleCardStatus,
    deleteCard,
    regenerateCard,
    refillCard
};
