const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');

mongoose.connect('mongodb+srv://krishnauppala:9441072101kK@cluster0.kqpw5.mongodb.net/personal_finance_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkAndCreateIncomeData() {
  try {
    // First check existing income transactions
    const incomeTransactions = await Transaction.find({ type: 'income' });
    console.log('📊 Found', incomeTransactions.length, 'income transactions');
    
    if (incomeTransactions.length === 0) {
      // Get a user ID from existing transactions
      const anyTransaction = await Transaction.findOne();
      if (!anyTransaction) {
        console.log('❌ No transactions found in database');
        return;
      }
      
      const userId = anyTransaction.userId;
      console.log('🆔 Using userId:', userId);
      
      // Create some test income transactions
      const testIncomeTransactions = [
        {
          userId: userId,
          type: 'income',
          category: 'Salary',
          amount: 5000,
          description: 'Monthly salary',
          date: new Date('2024-01-15')
        },
        {
          userId: userId,
          type: 'income',
          category: 'Freelance',
          amount: 1200,
          description: 'Project payment',
          date: new Date('2024-01-20')
        },
        {
          userId: userId,
          type: 'income',
          category: 'Investment',
          amount: 800,
          description: 'Dividend payment',
          date: new Date('2024-01-25')
        }
      ];
      
      await Transaction.insertMany(testIncomeTransactions);
      console.log('✅ Created test income transactions');
    }
    
    // Test the aggregation for income categories
    const incomeCategories = await Transaction.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } }
    ]);
    
    console.log('📊 Income by category:');
    incomeCategories.forEach(cat => {
      console.log('💰', cat._id, ':', cat.total);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

checkAndCreateIncomeData();
