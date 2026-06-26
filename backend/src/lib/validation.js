const Joi = require('joi');

const schemas = {
    register: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(128).required(),
        phone: Joi.string().pattern(/^\+?[0-9]{7,15}$/).optional(),
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),

    transfer: Joi.object({
        receiverId: Joi.string().uuid().required(),
        amount: Joi.number().positive().max(999999999.99).required(),
        currency: Joi.string().valid('MAD', 'EUR', 'USD').default('MAD'),
        note: Joi.string().max(500).optional().allow(''),
    }),

    deposit: Joi.object({
        amount: Joi.number().positive().max(999999999.99).required(),
        currency: Joi.string().valid('MAD', 'EUR', 'USD', 'BTC', 'ETH', 'USDT').default('MAD'),
        source: Joi.string().valid('bank', 'card', 'crypto', 'store').default('bank'),
    }),

    withdraw: Joi.object({
        amount: Joi.number().positive().max(999999999.99).required(),
        currency: Joi.string().valid('MAD', 'EUR', 'USD', 'BTC', 'ETH', 'USDT').default('MAD'),
        destination: Joi.string().required(),
        method: Joi.string().valid('bank', 'crypto', 'paypal').default('bank'),
    }),

    cardIssue: Joi.object({
        cardHolder: Joi.string().min(2).max(100).required(),
    }),

    cardRefill: Joi.object({
        cardId: Joi.string().uuid().required(),
        amount: Joi.number().positive().max(99999.99).required(),
        sourceWalletId: Joi.string().uuid().optional(),
    }),

    kycSubmit: Joi.object({
        documentType: Joi.string().valid('PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE').required(),
        documentFront: Joi.string().optional(),
        documentBack: Joi.string().optional(),
    }),

    exchangeConvert: Joi.object({
        from: Joi.string().valid('MAD', 'EUR', 'USD', 'BTC', 'ETH', 'USDT').required(),
        to: Joi.string().valid('MAD', 'EUR', 'USD', 'BTC', 'ETH', 'USDT').required(),
        amount: Joi.number().positive().max(999999999.99).required(),
    }),

    merchantOnboarding: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        description: Joi.string().max(1000).optional().allow(''),
        category: Joi.string().valid('RETAIL', 'FOOD', 'SERVICES', 'TECHNOLOGY', 'HEALTH', 'EDUCATION', 'OTHER').optional(),
    }),

    settlementRequest: Joi.object({
        amount: Joi.number().positive().max(999999999.99).required(),
        bankInfo: Joi.object({
            bankName: Joi.string().optional(),
            accountNumber: Joi.string().optional(),
            iban: Joi.string().optional(),
        }).optional(),
    }),

    changePassword: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).max(128).required(),
    }),

    adminApproveMerchant: Joi.object({
        merchantId: Joi.string().uuid().required(),
        action: Joi.string().valid('APPROVED', 'REJECTED').required(),
    }),

    createDispute: Joi.object({
        transactionId: Joi.string().uuid().required(),
        reason: Joi.string().min(10).max(500).required(),
        description: Joi.string().max(2000).optional().allow(''),
    }),
};

function validate(schemaName) {
    const schema = schemas[schemaName];
    if (!schema) {
        throw new Error(`Unknown validation schema: ${schemaName}`);
    }
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const messages = error.details.map(d => d.message).join('; ');
            return res.status(400).json({ error: `Validation failed: ${messages}` });
        }
        req.body = value;
        next();
    };
}

module.exports = { validate, schemas };
