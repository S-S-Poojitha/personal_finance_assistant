// Script to create a test user
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_finance');
        console.log('Connected to MongoDB');
        
        // Check if test user already exists
        const existingUser = await User.findOne({ username: 'testuser' });
        if (existingUser) {
            console.log('✅ Test user already exists:', existingUser.username);
            await mongoose.disconnect();
            return;
        }
        
        // Create test user
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash('password123', saltRounds);
        const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        
        const testUser = new User({
            userId,
            username: 'testuser',
            email: 'test@example.com',
            password: hashedPassword
        });
        
        await testUser.save();
        console.log('✅ Test user created successfully!');
        console.log('📋 Login credentials:');
        console.log('   Username: testuser');
        console.log('   Password: password123');
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
    }
};

createTestUser();
