export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
};

export const formatDate = (date) => {
    // Handle timezone issues properly by using the date components directly
    const d = new Date(date);
    
    // Use getUTCDate, getUTCMonth, getUTCFullYear to avoid timezone shift
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    
    // Return in DD/MM/YYYY format for Indian locale
    return `${day}/${month}/${year}`;
};

export const predefinedCategories = {
    income: [
        'Salary', 'Freelance', 'Business', 'Investment', 'Dividend', 'Gift', 'Other Income'
    ],
    expense: [
        'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities',
        'Healthcare', 'Education', 'Travel', 'Groceries', 'Rent', 'Insurance',
        'Subscriptions', 'Personal Care', 'Clothing', 'Electronics', 'Home & Garden',
        'Sports & Fitness', 'Gifts & Donations', 'Banking Fees', 'Taxes', 'GST', 'Uncategorized'
    ]
};

export const getTransactionTypeColor = (type) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
};

export const getTransactionTypeBadge = (type) => {
    return type === 'income' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800';
};

export const validateTransactionForm = ({ type, amount, category, description }) => {
    const errors = {};

    if (!type) errors.type = 'Type is required';
    if (!amount || isNaN(amount) || amount <= 0) errors.amount = 'Valid amount is required';
    if (!category) errors.category = 'Category is required';
    if (!description || description.length < 3) errors.description = 'Description must be at least 3 characters';

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
