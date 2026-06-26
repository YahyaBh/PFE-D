function validate(schema, data) {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
            continue;
        }
        if (value === undefined || value === null) continue;
        if (rules.type === 'number') {
            const num = parseFloat(value);
            if (isNaN(num)) {
                errors.push(`${field} must be a number`);
            } else if (rules.min !== undefined && num < rules.min) {
                errors.push(`${field} must be at least ${rules.min}`);
            } else if (rules.max !== undefined && num > rules.max) {
                errors.push(`${field} must be at most ${rules.max}`);
            }
        }
        if (rules.type === 'string' && typeof value === 'string') {
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`${field} must be at least ${rules.minLength} characters`);
            }
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`${field} must be at most ${rules.maxLength} characters`);
            }
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(`${field} format is invalid`);
            }
        }
        if (rules.oneOf && !rules.oneOf.includes(value)) {
            errors.push(`${field} must be one of: ${rules.oneOf.join(', ')}`);
        }
    }
    return errors.length > 0 ? { valid: false, errors } : { valid: true, errors: [] };
}

module.exports = { validate };