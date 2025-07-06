// Check users with updated model
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_finance');
        console.log('✅ Connected to MongoDB Atlas');
        console.log('📍 Database:', mongoose.connection.db.databaseName);
        
        // Check users using the User model (should now use 'user' collection)
        const users = await User.find({}).select('username email createdAt').limit(10);
        console.log(`📊 Found ${users.length} users using User model`);
        
        if (users.length > 0) {
            console.log('\n👥 Users found:');
            users.forEach((user, index) => {
                console.log(`  ${index + 1}. Username: ${user.username}, Email: ${user.email}`);
            });
            
            // Test login for UserA
            console.log('\n🔐 Testing UserA existence:');
            const userA = await User.findOne({ username: 'UserA' });
            if (userA) {
                console.log('✅ UserA found in database');
                console.log(`   Email: ${userA.email}`);
                console.log(`   HasPassword: ${userA.password ? 'Yes' : 'No'}`);
            } else {
                console.log('❌ UserA not found');
            }
        } else {
            console.log('❌ No users found');
            
            // Let's also check the raw 'user' collection
            console.log('\n🔍 Checking raw "user" collection:');
            const userCollection = mongoose.connection.db.collection('user');
            const rawUsers = await userCollection.find({}).limit(5).toArray();
            console.log(`📊 Found ${rawUsers.length} users in raw "user" collection`);
            
            if (rawUsers.length > 0) {
                rawUsers.forEach((user, index) => {
                    console.log(`  ${index + 1}. Username: ${user.username}, Email: ${user.email}`);
                });
            }
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

checkUsers();
