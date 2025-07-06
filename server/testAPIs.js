// Test API endpoints
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const testAPIs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_finance');
        console.log('✅ Connected to MongoDB Atlas');
        
        // Test User model
        const users = await User.find({}).limit(3);
        console.log(`📊 Users found: ${users.length}`);
        users.forEach(user => {
            console.log(`  - ${user.username} (${user.email})`);
        });
        
        // Test Transaction model
        const transactions = await Transaction.find({}).limit(5);
        console.log(`\n📊 Transactions found: ${transactions.length}`);
        if (transactions.length > 0) {
            transactions.forEach((t, index) => {
                console.log(`  ${index + 1}. ${t.type}: ${t.amount} (${t.category}) - ${t.description || 'No description'}`);
            });
        } else {
            console.log('❌ No transactions found');
            
            // Check if transactions collection exists with raw query
            console.log('\n🔍 Checking raw transactions collection:');
            const transCollection = mongoose.connection.db.collection('transactions');
            const rawTransactions = await transCollection.find({}).limit(3).toArray();
            console.log(`📊 Raw transactions found: ${rawTransactions.length}`);
            
            if (rawTransactions.length > 0) {
                rawTransactions.forEach((t, index) => {
                    console.log(`  ${index + 1}. ${JSON.stringify(t, null, 2)}`);
                });
            }
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testAPIs();
