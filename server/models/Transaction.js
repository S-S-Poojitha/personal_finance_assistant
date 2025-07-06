// server/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['income', 'expense'],
        lowercase: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true,
        enum: [
            // Income categories
            'Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other Income',
            // Expense categories
            'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities',
            'Healthcare', 'Education', 'Travel', 'Groceries', 'Rent', 'Insurance',
            'Subscriptions', 'Personal Care', 'Clothing', 'Electronics', 'Home & Garden',
            'Sports & Fitness', 'Gifts & Donations', 'Banking Fees', 'Taxes','GST','Uncategorized'
        ]
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    source: {
        type: String,
        enum: ['manual', 'receipt', 'statement'],
        default: 'manual'
    },
    attachments: [{
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
transactionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for efficient querying
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);