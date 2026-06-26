const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');

const transactionRepository = {
    async create(txData, connection = db) {
        const id = uuidv4();
        await connection.query(
            'INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                id, 
                txData.senderWalletId, 
                txData.receiverWalletId, 
                txData.amount, 
                txData.currency || 'MAD', 
                txData.type, 
                txData.status || 'COMPLETED', 
                txData.note || ''
            ]
        );
        return id;
    }
};

module.exports = transactionRepository;
