const transferService = require('../services/transferService');
const { validate } = require('../lib/validate');

const transferController = {
    async handleTransfer(req, res) {
        const { receiverId, amount, currency } = req.body;
        const senderId = req.user.id;

        const check = validate({
            receiverId: { required: true, type: 'string' },
            amount: { required: true, type: 'number', min: 0.01 }
        }, req.body);
        if (!check.valid) {
            return res.status(400).json({ error: check.errors.join('; ') });
        }

        try {
            const result = await transferService.executeTransfer(
                senderId, 
                receiverId, 
                amount, 
                currency, 
                req
            );

            res.json({ message: 'Transfer successful', ...result });
        } catch (err) {
            console.error('Transfer Controller Error:', err.message);
            res.status(500).json({ error: err.message || 'Server error during transfer' });
        }
    }
};

module.exports = transferController;
