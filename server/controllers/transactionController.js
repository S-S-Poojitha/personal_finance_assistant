const Transaction = require('../models/Transaction');
const { validateTransactionInput } = require('../utils/validation');
const aiService = require('../services/aiService');

const transactionController = {
    // Add new transaction
    addTransaction: async (req, res) => {
        try {
            const { type, amount, category, description, date } = req.body;

            // Validate input
            const validation = validateTransactionInput({ type, amount, category, description, date });
            if (!validation.isValid) {
                return res.status(400).json({ message: validation.message });
            }

            console.log('💰 Adding transaction for user:', req.user.userId);

            const transaction = new Transaction({ 
                ...req.body, 
                userId: req.user.userId,
                amount: parseFloat(amount)
            });
            
            await transaction.save();

            console.log('✅ Transaction added:', transaction.type, transaction.amount);
            res.status(201).json({ 
                message: 'Transaction added successfully', 
                data: transaction 
            });
        } catch (err) {
            console.error('❌ Transaction add error:', err.message);
            res.status(500).json({ message: 'Failed to add transaction' });
        }
    },

    // Get transactions with filtering and pagination
    getTransactions: async (req, res) => {
        try {
            const { page = 1, limit = 10, start, end } = req.query;
            const filter = { userId: req.user.userId };

            // Validate pagination parameters
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page

            // Add date filtering (can use start only, end only, or both)
            if (start || end) {
                filter.date = {};
                if (start) {
                    filter.date.$gte = new Date(start);
                }
                if (end) {
                    filter.date.$lte = new Date(end);
                }
            }

            console.log('📋 Fetching transactions for user:', req.user.userId);
            console.log('🔍 Full user object:', req.user);
            console.log('🔍 Filter:', filter);

            const transactions = await Transaction.find(filter)
                .sort({ date: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum);

            const total = await Transaction.countDocuments(filter);

            console.log('✅ Found', transactions.length, 'transactions');
            
            // Return just the transactions array for compatibility
            res.json(transactions);
        } catch (err) {
            console.error('❌ Transaction fetch error:', err.message);
            res.status(500).json({ message: 'Failed to fetch transactions' });
        }
    },

    // Get transaction categories
    getCategories: async (req, res) => {
        try {
            const categories = await Transaction.distinct('category', { userId: req.user.userId });
            res.json({ categories });
        } catch (err) {
            console.error('❌ Categories fetch error:', err.message);
            res.status(500).json({ message: 'Failed to fetch categories' });
        }
    },

    // Auto-categorize transaction
    autoCategorize: async (req, res) => {
        try {
            const { description } = req.body;

            if (!description) {
                return res.status(400).json({ message: 'Description is required' });
            }

            console.log('🤖 Auto-categorizing:', description);

            const category = await aiService.categorizeTransaction(description);

            console.log('✅ Categorized as:', category);
            res.json({ category });
        } catch (err) {
            console.error('❌ Auto-categorization error:', err.message);
            res.json({ category: 'Uncategorized' }); // Graceful fallback
        }
    },

    // Get summary by category (expenses only)
    getSummaryByCategory: async (req, res) => {
        try {
            console.log('📊 Generating expense category summary for user:', req.user.userId);

            const summary = await Transaction.aggregate([
                { $match: { userId: req.user.userId, type: 'expense' } },
                { $group: { _id: "$category", total: { $sum: "$amount" } } },
                { $sort: { total: -1 } }
            ]);

            console.log('✅ Expense category summary generated:', summary.length, 'categories');
            res.json(summary);
        } catch (err) {
            console.error('❌ Expense category summary error:', err.message);
            res.status(500).json({ message: 'Failed to aggregate expense categories' });
        }
    },

    // Get income summary by category
    getIncomeSummaryByCategory: async (req, res) => {
        try {
            console.log('📊 Generating income category summary for user:', req.user.userId);

            const summary = await Transaction.aggregate([
                { $match: { userId: req.user.userId, type: 'income' } },
                { $group: { _id: "$category", total: { $sum: "$amount" } } },
                { $sort: { total: -1 } }
            ]);

            console.log('✅ Income category summary generated:', summary.length, 'categories');
            res.json(summary);
        } catch (err) {
            console.error('❌ Income category summary error:', err.message);
            res.status(500).json({ message: 'Failed to aggregate income categories' });
        }
    },

    // Get summary by date
    getSummaryByDate: async (req, res) => {
        try {
            console.log('📈 Generating date summary for user:', req.user.userId);

            const summary = await Transaction.aggregate([
                { $match: { userId: req.user.userId, type: 'expense' } },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$date" }
                        },
                        total: { $sum: "$amount" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            console.log('✅ Date summary generated:', summary.length, 'days');
            res.json(summary);
        } catch (err) {
            console.error('❌ Date summary error:', err.message);
            res.status(500).json({ message: 'Failed to aggregate by date' });
        }
    }
};

module.exports = transactionController;
