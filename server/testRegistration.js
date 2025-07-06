// Test registration endpoint
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testRegistration() {
    try {
        console.log('🔄 Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        // Test data
        const testUser = {
            username: 'testuser_' + Date.now(),
            email: 'test_' + Date.now() + '@example.com',
            password: 'testpass123'
        };

        console.log('🧪 Testing registration with:', testUser.username);

        // Check if any existing users conflict
        const existingUser = await User.findOne({ 
            $or: [{ username: testUser.username }, { email: testUser.email }] 
        });

        if (existingUser) {
            console.log('❌ User already exists:', existingUser.username);
            return;
        }

        // Try to create user
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        const user = new User({ 
            userId, 
            username: testUser.username, 
            email: testUser.email, 
            password: hashedPassword 
        });
        
        await user.save();
        console.log('✅ Test user created successfully:', testUser.username);

        // Clean up
        await User.deleteOne({ _id: user._id });
        console.log('🧹 Test user cleaned up');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.code === 11000) {
            console.log('🔍 Duplicate key error details:', error.keyPattern);
        }
    } finally {
        await mongoose.connection.close();
        console.log('🔐 Database connection closed');
    }
}

testRegistration();
