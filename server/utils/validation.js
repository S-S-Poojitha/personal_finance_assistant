const validateTransactionInput = ({ type, amount, category, description, date }) => {
    if (!type || !amount || !category || !description) {
        return { isValid: false, message: 'All fields are required' };
    }

    if (!['income', 'expense'].includes(type)) {
        return { isValid: false, message: 'Type must be income or expense' };
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        return { isValid: false, message: 'Amount must be a positive number' };
    }

    if (numAmount > 10000000) { // 1 crore limit
        return { isValid: false, message: 'Amount too large' };
    }

    if (description.length < 3) {
        return { isValid: false, message: 'Description must be at least 3 characters' };
    }

    if (description.length > 255) {
        return { isValid: false, message: 'Description must be less than 255 characters' };
    }

    return { isValid: true };
};

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateUsername = (username) => {
    if (username.length < 3 || username.length > 30) {
        return false;
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username);
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
};

module.exports = {
    validateTransactionInput,
    validateEmail,
    validateUsername,
    sanitizeInput
};
