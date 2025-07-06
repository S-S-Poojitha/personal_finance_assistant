const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoOptions = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        };

        console.log('🔄 Attempting to connect to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI, mongoOptions);

        console.log('✅ Connected to MongoDB');
        console.log('📊 Database:', mongoose.connection.name);
        console.log('🌍 Environment:', process.env.NODE_ENV);
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('🔄 Server will continue without database...');
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected');
});

module.exports = connectDB;
