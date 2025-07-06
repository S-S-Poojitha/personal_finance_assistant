// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');

// Import configurations and middleware
const connectDB = require('./config/database');
const { requestLogger, errorHandler } = require('./middleware');

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const uploadRoutes = require('./routes/upload');

const app = express();

// Environment Variables with defaults
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/';

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not set - using fallback (not secure for production)');
}

if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set - using localhost fallback');
}

if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not found - AI features will be limited');
}

// Connect to database
connectDB();

// CORS configuration based on environment
const corsOptions = {
    origin: NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL?.split(',') || ['https://your-frontend-domain.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('📁 Created uploads directory:', UPLOAD_DIR);
}

// Health check route
app.get('/ping', (req, res) => {
    console.log('🏓 Ping received at:', new Date().toISOString());
    res.json({
        message: 'pong',
        timestamp: new Date().toISOString(),
        server: 'Personal Finance API',
        environment: NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Basic info route
app.get('/', (req, res) => {
    res.json({
        message: 'Personal Finance Assistant API',
        status: 'running',
        environment: NODE_ENV,
        endpoints: {
            auth: '/api/auth',
            transactions: '/api/transactions',
            upload: '/api/upload',
            health: '/ping'
        },
        features: {
            aiCategorization: !!process.env.GEMINI_API_KEY,
            fileUpload: true,
            charts: true,
            multiUser: true
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    console.log('🚀 Server starting...');
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log('📊 API endpoints available:');
    console.log('   GET  /ping');
    console.log('   POST /api/auth/register');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/transactions');
    console.log('   POST /api/transactions');
    console.log('   GET  /api/transactions/summary/by-category');
    console.log('   GET  /api/transactions/summary/by-date');
    console.log('   POST /api/upload/pdf');
    console.log('   POST /api/upload/image');
    console.log('🎯 Ready to accept requests!');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    
    server.close(() => {
        console.log('✅ HTTP server closed');
    });
    
    try {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
    }
    
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});

module.exports = app;
