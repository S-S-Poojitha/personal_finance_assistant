// server/models/Transaction.js
require('dotenv').config();
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    type: { type: String, required: true, enum: ['income', 'expense'] },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema, 'transactions');