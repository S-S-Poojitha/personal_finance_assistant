const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://personafinance2024:finance2024@personalfinance.yhqeb.mongodb.net/personal_finance?retryWrites=true&w=majority&appName=PersonalFinance';

// Transaction schema
const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

async function debugTransactions() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all transactions
        const allTransactions = await Transaction.find({}).sort({ date: -1 });
        console.log(`\n📊 Total transactions found: ${allTransactions.length}`);

        // Group by type
        const incomeCount = allTransactions.filter(t => t.type === 'income').length;
        const expenseCount = allTransactions.filter(t => t.type === 'expense').length;
        console.log(`💰 Income transactions: ${incomeCount}`);
        console.log(`💸 Expense transactions: ${expenseCount}`);

        // Check for July 7, 2025 transactions specifically
        const july7Transactions = allTransactions.filter(t => {
            const dateStr = new Date(t.date).toISOString().split('T')[0];
            return dateStr === '2025-07-07';
        });

        console.log(`\n🗓️ July 7, 2025 transactions found: ${july7Transactions.length}`);
        july7Transactions.forEach((t, index) => {
            const dateStr = new Date(t.date).toISOString().split('T')[0];
            console.log(`  ${index + 1}. ${dateStr} | Type: "${t.type}" | Category: "${t.category}" | Description: "${t.description}" | Amount: ${t.amount}`);
        });

        // Show recent transactions for context
        console.log('\n📋 Last 10 transactions:');
        allTransactions.slice(0, 10).forEach((t, index) => {
            const dateStr = new Date(t.date).toISOString().split('T')[0];
            console.log(`  ${index + 1}. ${dateStr} | ${t.type} | ${t.category} | ${t.description} | ₹${t.amount}`);
        });

        // Check for any transactions with unusual type values
        const uniqueTypes = [...new Set(allTransactions.map(t => t.type))];
        console.log('\n🔍 Unique transaction types found:', uniqueTypes);

        // Check for any transactions that might have whitespace or case issues
        const typeIssues = allTransactions.filter(t => 
            t.type !== t.type.trim() || 
            (t.type !== 'income' && t.type !== 'expense')
        );
        if (typeIssues.length > 0) {
            console.log('\n⚠️ Transactions with type issues:', typeIssues.length);
            typeIssues.forEach(t => {
                console.log(`  - Type: "${t.type}" (length: ${t.type.length}) | Description: ${t.description}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

debugTransactions();
