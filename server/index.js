// // // personal-finance-assistant/server/index.js
// //
// // const express = require('express');
// // const cors = require('cors');
// // const mongoose = require('mongoose');
// // const multer = require('multer');
// // const jwt = require('jsonwebtoken');
// // const bcrypt = require('bcrypt');
// // const pdfParse = require('pdf-parse');
// // const axios = require('axios');
// // const fs = require('fs');
// // const path = require('path');
// //
// // const app = express();
// // const PORT = 8000;
// // const JWT_SECRET = 'your_jwt_secret_key';
// //
// // // ------------------------ MongoDB Connection ------------------------
// //
// // mongoose.connect('mongodb+srv://sarvamangalapoojitha:mongo@cluster1.xkopp.mongodb.net/Finance?retryWrites=true&w=majority')
// //     .then(() => console.log('Connected to MongoDB Atlas'))
// //     .catch((err) => console.error('MongoDB connection error:', err));
// //
// // mongoose.connection.on('connected', () => {
// //     console.log('Mongoose connected to DB:', mongoose.connection.name);
// // });
// //
// // // ------------------------ Schemas ------------------------
// //
// // const userSchema = new mongoose.Schema({
// //     userId: { type: String, unique: true, required: true }, // Add this line
// //     username: { type: String, unique: true, required: true },
// //     email: { type: String, unique: true, required: true },
// //     password: { type: String, required: true }
// // });
// // const transactionSchema = new mongoose.Schema({
// //     userId: { type: String, required: true },
// //     type: String,
// //     amount: Number,
// //     category: String,
// //     description: String,
// //     date: { type: Date, default: Date.now }
// // });
// //
// // const aggregateSchema = new mongoose.Schema({
// //     userId: { type: String, required: true },
// //     month: String,
// //     income: Number,
// //     expense: Number,
// //     byCategory: [{ category: String, total: Number }],
// //     createdAt: { type: Date, default: Date.now },
// //     updatedAt: { type: Date, default: Date.now }
// // });
// //
// // aggregateSchema.pre('save', function (next) {
// //     this.updatedAt = Date.now();
// //     next();
// // });
// //
// // const User = mongoose.model('User', userSchema, 'user');
// // const Transaction = mongoose.model('Transaction', transactionSchema, 'transactions');
// // const Aggregate = mongoose.model('Aggregate', aggregateSchema);
// //
// // // ------------------------ Middleware ------------------------
// //
// // app.use(cors());
// // app.use(express.json());
// //
// // function authenticateToken(req, res, next) {
// //     const authHeader = req.headers['authorization'];
// //     const token = authHeader && authHeader.split(' ')[1];
// //     if (!token) return res.sendStatus(401);
// //
// //     jwt.verify(token, JWT_SECRET, (err, decoded) => {
// //         if (err) return res.sendStatus(403);
// //         req.user = { id: decoded.id, userId: decoded.userId };
// //         next();
// //     });
// // }
// //
// // // ------------------------ File Upload ------------------------
// //
// // const storage = multer.diskStorage({
// //     destination: './uploads/',
// //     filename: (req, file, cb) => {
// //         cb(null, Date.now() + '-' + file.originalname);
// //     }
// // });
// // const upload = multer({ storage });
// //
// // // ------------------------ Routes ------------------------
// //
// // app.get('/ping', (req, res) => {
// //     res.send('pong');
// // });
// //
// // // Register
// // app.post('/api/register', async (req, res) => {
// //     try {
// //         const { username, email, password } = req.body;
// //         const hashed = await bcrypt.hash(password, 10);
// //         const userId = bcrypt.genSaltSync(10).slice(-12);
// //         const user = new User({ userId, username, email, password: hashed });
// //         await user.save();
// //         res.json({ message: 'User registered' });
// //     } catch (err) {
// //         res.status(400).json({ message: 'Registration failed', error: err.message });
// //     }
// // });
// //
// // // Login
// // app.post('/api/login', async (req, res) => {
// //     try {
// //         const { username, password } = req.body;
// //         const user = await User.findOne({ username });
// //         if (!user || !(await bcrypt.compare(password, user.password))) {
// //             return res.status(401).json({ message: 'Invalid credentials' });
// //         }
// //         const token = jwt.sign({ id: user._id, userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });
// //         res.json({ token, userId: user.userId });
// //     } catch (err) {
// //         res.status(500).json({ message: 'Internal server error' });
// //     }
// // });
// //
// // // Auto-categorization
// // app.post('/api/autocategorize', authenticateToken, async (req, res) => {
// //     const { description } = req.body;
// //
// //     try {
// //         const response = await axios.post(
// //             'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDxG_Dn27XZ-OSeg_iWbGduohqD9gYrGiI',
// //             {
// //                 contents: [
// //                     {
// //                         parts: [
// //                             {
// //                                 text: `
// // You're a finance assistant. Categorize this transaction description:
// // "${description}"
// //
// // Return only the category as one of:
// // - Food
// // - Groceries
// // - Transport
// // - Healthcare
// // - Entertainment
// // - Taxes (for GST, tax, etc.)
// // - Summary (for Subtotal, Total lines)
// // - Income
// // - Rent
// // - Bills & Utilities
// // - Other
// //
// // If it’s unclear, return "Uncategorized".
// //                 `.trim()
// //                             }
// //                         ]
// //                     }
// //                 ]
// //             }
// //         );
// //
// //         const output = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
// //         const category = output || 'Uncategorized';
// //
// //         res.json({ category });
// //     } catch (err) {
// //         console.error('Auto-categorization error:', err.message);
// //         res.status(500).json({ message: 'Auto-categorization failed' });
// //     }
// // });
// //
// // // Add transaction
// // app.post('/api/transactions', authenticateToken, async (req, res) => {
// //     try {
// //         const tx = new Transaction({ ...req.body, userId: req.user.userId });
// //         await tx.save();
// //         res.json({ message: 'Transaction added', data: tx });
// //     } catch (err) {
// //         res.status(500).json({ message: 'Failed to add transaction' });
// //     }
// // });
// //
// // // List transactions
// // app.get('/api/transactions', authenticateToken, async (req, res) => {
// //     try {
// //         const { page = 1, limit = 10, start, end } = req.query;
// //         const filter = { userId: req.user.userId };
// //         if (start && end) {
// //             filter.date = { $gte: new Date(start), $lte: new Date(end) };
// //         }
// //         const transactions = await Transaction.find(filter)
// //             .sort({ date: -1 })
// //             .skip((page - 1) * limit)
// //             .limit(Number(limit));
// //         res.json(transactions);
// //     } catch (err) {
// //         res.status(500).json({ message: 'Failed to fetch transactions' });
// //     }
// // });
// //
// // // Categories
// // app.get('/api/categories', authenticateToken, async (req, res) => {
// //     try {
// //         const categories = await Transaction.distinct('category', { userId: req.user.userId });
// //         res.json({ categories });
// //     } catch (err) {
// //         res.status(500).json({ message: 'Failed to fetch categories' });
// //     }
// // });
// //
// // // HTML Categories
// // app.get('/api/categories/html', authenticateToken, async (req, res) => {
// //     try {
// //         const categories = await Transaction.distinct('category', { userId: req.user.userId });
// //         const html = `
// //             <label for="category">Category:</label>
// //             <select name="category" id="category">
// //                 ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
// //             </select>`;
// //         res.send(html);
// //     } catch (err) {
// //         res.status(500).send('<p>Failed to load categories</p>');
// //     }
// // });
// //
// // // Upload PDF receipt
// // app.post('/api/upload/pdf', authenticateToken, upload.single('file'), async (req, res) => {
// //     try {
// //         const pdfPath = req.file.path;
// //         const dataBuffer = fs.readFileSync(pdfPath);
// //         const data = await pdfParse(dataBuffer);
// //         fs.unlinkSync(pdfPath);
// //         res.json({ text: data.text });
// //     } catch (err) {
// //         res.status(500).json({ message: 'Failed to process PDF' });
// //     }
// // });
// //
// // // ------------------------ Chart APIs ------------------------
// //
// // // Group expenses by category (for pie chart)
// // app.get('/api/summary/by-category', authenticateToken, async (req, res) => {
// //     try {
// //         const summary = await Transaction.aggregate([
// //             { $match: { userId: req.user.userId, type: 'expense' } },
// //             { $group: { _id: "$category", total: { $sum: "$amount" } } },
// //             { $sort: { total: -1 } }
// //         ]);
// //         res.json(summary);
// //     } catch (err) {
// //         res.status(500).json({ message: 'Failed to aggregate by category' });
// //     }
// // });
// //
// // // Group expenses by date (for line/bar chart)
// // app.get('/api/summary/by-date', authenticateToken, async (req, res) => {
// //     try {
// //         const summary = await Transaction.aggregate([
// //             { $match: { userId: req.user.userId, type: 'expense' } },
// //             {
// //                 $group: {
// //                     _id: {
// //                         $dateToString: { format: "%Y-%m-%d", date: "$date" }
// //                     },
// //                     total: { $sum: "$amount" }
// //                 }
// //             },
// //             { $sort: { _id: 1 } }
// //         ]);
// //         res.json(summary);
// //     } catch (err) {
// //         res.status(500).json({ message: 'Failed to aggregate by date' });
// //     }
// // });
// //
// // // ------------------------ Server Start ------------------------
// //
// // app.listen(PORT, () => {
// //     console.log(`Server running on http://localhost:${PORT}`);
// // });
// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
// const pdfParse = require('pdf-parse');
// const axios = require('axios');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const PORT = 8000;
// const JWT_SECRET = 'your_jwt_secret_key';

// // ------------------------ MongoDB Connection with Timeout ------------------------

// const mongoOptions = {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
//     socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
//     family: 4 // Use IPv4, skip trying IPv6
// };

// // Your MongoDB connection string
// const MONGODB_URI = 'mongodb+srv://sarvamangalapoojitha:mongo@cluster1.xkopp.mongodb.net/Finance?retryWrites=true&w=majority';

// console.log('🔄 Attempting to connect to MongoDB...');

// mongoose.connect(MONGODB_URI, mongoOptions)
//     .then(() => {
//         console.log('✅ Connected to MongoDB Atlas');
//         console.log('📊 Database:', mongoose.connection.name);
//     })
//     .catch((err) => {
//         console.error('❌ MongoDB connection error:', err.message);
//         console.log('🔄 Server will continue without database...');
//     });

// // Handle connection events
// mongoose.connection.on('connected', () => {
//     console.log('🟢 Mongoose connected to MongoDB');
// });

// mongoose.connection.on('error', (err) => {
//     console.error('🔴 Mongoose connection error:', err);
// });

// mongoose.connection.on('disconnected', () => {
//     console.log('🟡 Mongoose disconnected');
// });

// // ------------------------ Schemas ------------------------

// const userSchema = new mongoose.Schema({
//     userId: { type: String, unique: true, required: true },
//     username: { type: String, unique: true, required: true },
//     email: { type: String, unique: true, required: true },
//     password: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now }
// });

// const transactionSchema = new mongoose.Schema({
//     userId: { type: String, required: true },
//     type: { type: String, required: true, enum: ['income', 'expense'] },
//     amount: { type: Number, required: true },
//     category: { type: String, required: true },
//     description: { type: String, required: true },
//     date: { type: Date, default: Date.now },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now }
// });

// const User = mongoose.model('User', userSchema, 'user');
// const Transaction = mongoose.model('Transaction', transactionSchema, 'transactions');

// // ------------------------ Middleware ------------------------

// app.use(cors({
//     origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
//     credentials: true
// }));

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// function authenticateToken(req, res, next) {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
//     if (!token) return res.sendStatus(401);

//     jwt.verify(token, JWT_SECRET, (err, decoded) => {
//         if (err) return res.sendStatus(403);
//         req.user = { id: decoded.id, userId: decoded.userId };
//         next();
//     });
// }

// // ------------------------ File Upload ------------------------

// const storage = multer.diskStorage({
//     destination: './uploads/',
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname);
//     }
// });
// const upload = multer({ storage });

// // Create uploads directory if it doesn't exist
// if (!fs.existsSync('./uploads')) {
//     fs.mkdirSync('./uploads');
//     console.log('📁 Created uploads directory');
// }

// // ------------------------ Routes ------------------------

// // Health check route (this should be fast)
// app.get('/ping', (req, res) => {
//     console.log('🏓 Ping received at:', new Date().toISOString());
//     res.json({
//         message: 'pong',
//         timestamp: new Date().toISOString(),
//         server: 'Personal Finance API'
//     });
// });

// // Basic info route
// app.get('/', (req, res) => {
//     res.json({
//         message: 'Personal Finance Assistant API',
//         status: 'running',
//         endpoints: ['/ping', '/api/register', '/api/login', '/api/transactions']
//     });
// });

// // Register
// app.post('/api/register', async (req, res) => {
//     try {
//         const { username, email, password } = req.body;

//         console.log('📝 Registration attempt for:', username);

//         const hashed = await bcrypt.hash(password, 10);
//         const userId = bcrypt.genSaltSync(10).slice(-12);

//         const user = new User({ userId, username, email, password: hashed });
//         await user.save();

//         console.log('✅ User registered successfully:', username);
//         res.json({ message: 'User registered successfully' });
//     } catch (err) {
//         console.error('❌ Registration error:', err.message);
//         res.status(400).json({ message: 'Registration failed', error: err.message });
//     }
// });

// // Login
// app.post('/api/login', async (req, res) => {
//     try {
//         const { username, password } = req.body;

//         console.log('🔐 Login attempt for:', username);

//         const user = await User.findOne({ username });
//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             console.log('❌ Invalid credentials for:', username);
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         const token = jwt.sign({ id: user._id, userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });

//         console.log('✅ Login successful for:', username);
//         res.json({ token, userId: user.userId });
//     } catch (err) {
//         console.error('❌ Login error:', err.message);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// // Auto-categorization
// app.post('/api/autocategorize', authenticateToken, async (req, res) => {
//     const { description } = req.body;

//     try {
//         console.log('🤖 Auto-categorizing:', description);

//         const response = await axios.post(
//             'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDxG_Dn27XZ-OSeg_iWbGduohqD9gYrGiI',
//             {
//                 contents: [
//                     {
//                         parts: [
//                             {
//                                 text: `
// You're a finance assistant. Categorize this transaction description:
// "${description}"

// Return only the category as one of:
// - Food & Dining
// - Transportation  
// - Shopping
// - Entertainment
// - Bills & Utilities
// - Healthcare
// - Education
// - Travel
// - Groceries
// - Rent
// - Insurance
// - Subscriptions
// - Personal Care
// - Clothing
// - Electronics
// - Home & Garden
// - Sports & Fitness
// - Gifts & Donations
// - Banking Fees
// - Taxes
// - GST
// - Salary
// - Freelance
// - Business
// - Investment
// - Gift
// - Other Income
// - Uncategorized

// If it's unclear, return "Uncategorized".
//                 `.trim()
//                             }
//                         ]
//                     }
//                 ]
//             }
//         );

//         const output = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
//         const category = output || 'Uncategorized';

//         console.log('✅ Categorized as:', category);
//         res.json({ category });
//     } catch (err) {
//         console.error('❌ Auto-categorization error:', err.message);
//         res.status(500).json({ message: 'Auto-categorization failed' });
//     }
// });

// // Add transaction
// app.post('/api/transactions', authenticateToken, async (req, res) => {
//     try {
//         console.log('💰 Adding transaction for user:', req.user.userId);

//         const tx = new Transaction({ ...req.body, userId: req.user.userId });
//         await tx.save();

//         console.log('✅ Transaction added:', tx.type, tx.amount);
//         res.json({ message: 'Transaction added', data: tx });
//     } catch (err) {
//         console.error('❌ Transaction add error:', err.message);
//         res.status(500).json({ message: 'Failed to add transaction' });
//     }
// });

// // List transactions
// app.get('/api/transactions', authenticateToken, async (req, res) => {
//     try {
//         const { page = 1, limit = 10, start, end } = req.query;
//         const filter = { userId: req.user.userId };

//         if (start && end) {
//             filter.date = { $gte: new Date(start), $lte: new Date(end) };
//         }

//         console.log('📋 Fetching transactions for user:', req.user.userId);

//         const transactions = await Transaction.find(filter)
//             .sort({ date: -1 })
//             .skip((page - 1) * limit)
//             .limit(Number(limit));

//         console.log('✅ Found', transactions.length, 'transactions');
//         res.json(transactions);
//     } catch (err) {
//         console.error('❌ Transaction fetch error:', err.message);
//         res.status(500).json({ message: 'Failed to fetch transactions' });
//     }
// });

// // Categories
// app.get('/api/categories', authenticateToken, async (req, res) => {
//     try {
//         const categories = await Transaction.distinct('category', { userId: req.user.userId });
//         res.json({ categories });
//     } catch (err) {
//         console.error('❌ Categories fetch error:', err.message);
//         res.status(500).json({ message: 'Failed to fetch categories' });
//     }
// });

// // Upload PDF receipt
// app.post('/api/upload/pdf', authenticateToken, upload.single('file'), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: 'No file uploaded' });
//         }

//         console.log('📄 Processing PDF:', req.file.originalname);

//         const pdfPath = req.file.path;
//         const dataBuffer = fs.readFileSync(pdfPath);
//         const data = await pdfParse(dataBuffer);

//         // Clean up uploaded file
//         fs.unlinkSync(pdfPath);

//         console.log('✅ PDF processed, extracted', data.text.length, 'characters');
//         res.json({ text: data.text });
//     } catch (err) {
//         console.error('❌ PDF processing error:', err.message);
//         res.status(500).json({ message: 'Failed to process PDF' });
//     }
// });

// // ------------------------ Chart APIs ------------------------

// // Group expenses by category (for pie chart)
// app.get('/api/summary/by-category', authenticateToken, async (req, res) => {
//     try {
//         console.log('📊 Generating category summary for user:', req.user.userId);

//         const summary = await Transaction.aggregate([
//             { $match: { userId: req.user.userId, type: 'expense' } },
//             { $group: { _id: "$category", total: { $sum: "$amount" } } },
//             { $sort: { total: -1 } }
//         ]);

//         console.log('✅ Category summary generated:', summary.length, 'categories');
//         res.json(summary);
//     } catch (err) {
//         console.error('❌ Category summary error:', err.message);
//         res.status(500).json({ message: 'Failed to aggregate by category' });
//     }
// });

// // Group expenses by date (for line/bar chart)
// app.get('/api/summary/by-date', authenticateToken, async (req, res) => {
//     try {
//         console.log('📈 Generating date summary for user:', req.user.userId);

//         const summary = await Transaction.aggregate([
//             { $match: { userId: req.user.userId, type: 'expense' } },
//             {
//                 $group: {
//                     _id: {
//                         $dateToString: { format: "%Y-%m-%d", date: "$date" }
//                     },
//                     total: { $sum: "$amount" }
//                 }
//             },
//             { $sort: { _id: 1 } }
//         ]);

//         console.log('✅ Date summary generated:', summary.length, 'days');
//         res.json(summary);
//     } catch (err) {
//         console.error('❌ Date summary error:', err.message);
//         res.status(500).json({ message: 'Failed to aggregate by date' });
//     }
// });

// // ------------------------ Server Start ------------------------

// app.listen(PORT, () => {
//     console.log('🚀 Server starting...');
//     console.log(`🌐 Server running on http://localhost:${PORT}`);
//     console.log('📊 API endpoints available:');
//     console.log('   GET  /ping');
//     console.log('   POST /api/register');
//     console.log('   POST /api/login');
//     console.log('   GET  /api/transactions');
//     console.log('   POST /api/transactions');
//     console.log('🎯 Ready to accept requests!');
// });

// // Handle process termination
// process.on('SIGINT', async () => {
//     console.log('\n🛑 Shutting down server...');
//     await mongoose.connection.close();
//     console.log('✅ MongoDB connection closed');
//     process.exit(0);
// });
// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();

// Environment Variables with defaults
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate critical environment variables
if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not found - AI features will be limited');
}

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not set - using fallback (not secure for production)');
}

if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set - using localhost fallback');
}

// ------------------------ MongoDB Connection with Timeout ------------------------

const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    family: 4 // Use IPv4, skip trying IPv6
};

console.log('🔄 Attempting to connect to MongoDB...');

mongoose.connect(MONGODB_URI, mongoOptions)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        console.log('📊 Database:', mongoose.connection.name);
        console.log('🌍 Environment:', NODE_ENV);
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('🔄 Server will continue without database...');
    });

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

// ------------------------ Schemas ------------------------

const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

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

const User = mongoose.model('User', userSchema, 'user');
const Transaction = mongoose.model('Transaction', transactionSchema, 'transactions');

// Import AI service
const aiService = require('./services/aiService');

// ------------------------ Middleware ------------------------

// CORS configuration based on environment
const corsOptions = {
    origin: NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] // Update with your actual frontend domain
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (only in development)
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`📥 ${req.method} ${req.url} - ${new Date().toISOString()}`);
        next();
    });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(403);
        req.user = { id: decoded.id, userId: decoded.userId };
        next();
    });
}

// ------------------------ File Upload ------------------------

const uploadDir = process.env.UPLOAD_DIR || './uploads/';

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
    }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadDir);
}

// ------------------------ Routes ------------------------

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
        endpoints: ['/ping', '/api/register', '/api/login', '/api/transactions'],
        features: {
            aiCategorization: !!GEMINI_API_KEY,
            fileUpload: true,
            charts: true
        }
    });
});

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log('📝 Registration attempt for:', username, 'with email:', email);
        console.log('📦 Request body received:', { username: !!username, email: !!email, password: !!password });

        // Input validation
        if (!username || !email || !password) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            console.log('❌ Password too short');
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check for existing user
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            const duplicateField = existingUser.username === username ? 'username' : 'email';
            console.log('❌ Duplicate field:', duplicateField);
            return res.status(400).json({ message: `${duplicateField} already exists` });
        }

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const hashed = await bcrypt.hash(password, saltRounds);
        const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        const user = new User({ userId, username, email, password: hashed });
        await user.save();

        console.log('✅ User registered successfully:', username);
        res.json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('❌ Registration error details:', {
            message: err.message,
            code: err.code,
            keyPattern: err.keyPattern,
            stack: err.stack
        });
        
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        
        res.status(400).json({ message: 'Registration failed', error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        console.log('🔐 Login attempt for:', username);

        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log('❌ Invalid credentials for:', username);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const tokenExpiry = process.env.JWT_EXPIRY || '24h';
        const token = jwt.sign({ id: user._id, userId: user.userId }, JWT_SECRET, { expiresIn: tokenExpiry });

        console.log('✅ Login successful for:', username);
        res.json({ token, userId: user.userId });
    } catch (err) {
        console.error('❌ Login error:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Auto-categorization
app.post('/api/autocategorize', authenticateToken, async (req, res) => {
    const { description } = req.body;

    if (!description) {
        return res.status(400).json({ message: 'Description is required' });
    }

    try {
        console.log('🤖 Auto-categorizing:', description);

        // Check if Gemini API is available
        if (!GEMINI_API_KEY) {
            console.log('⚠️ Gemini API key not available, using fallback categorization');
            return res.json({ category: 'Uncategorized' });
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `
You're a finance assistant. Categorize this transaction description:
"${description}"

Return only the category as one of:
- Food & Dining
- Transportation  
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Travel
- Groceries
- Rent
- Insurance
- Subscriptions
- Personal Care
- Clothing
- Electronics
- Home & Garden
- Sports & Fitness
- Gifts & Donations
- Banking Fees
- Taxes
- GST
- Salary
- Freelance
- Business
- Investment
- Gift
- Other Income
- Uncategorized

If it's unclear, return "Uncategorized".
                `.trim()
                            }
                        ]
                    }
                ]
            },
            {
                timeout: parseInt(process.env.API_TIMEOUT) || 10000 // 10s timeout
            }
        );

        const output = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        const category = output || 'Uncategorized';

        console.log('✅ Categorized as:', category);
        res.json({ category });
    } catch (err) {
        console.error('❌ Auto-categorization error:', err.message);
        res.json({ category: 'Uncategorized' }); // Graceful fallback
    }
});

// Add transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { type, amount, category, description, date } = req.body;

        // Input validation
        if (!type || !amount || !category || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be positive' });
        }

        if (amount > 10000000) { // 1 crore limit
            return res.status(400).json({ message: 'Amount too large' });
        }

        console.log('💰 Adding transaction for user:', req.user.userId);

        const tx = new Transaction({ 
            ...req.body, 
            userId: req.user.userId,
            amount: parseFloat(amount)
        });
        await tx.save();

        console.log('✅ Transaction added:', tx.type, tx.amount);
        res.json({ message: 'Transaction added', data: tx });
    } catch (err) {
        console.error('❌ Transaction add error:', err.message);
        res.status(500).json({ message: 'Failed to add transaction' });
    }
});

// List transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, start, end } = req.query;
        const filter = { userId: req.user.userId };

        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page

        if (start && end) {
            filter.date = { $gte: new Date(start), $lte: new Date(end) };
        }

        console.log('📋 Fetching transactions for user:', req.user.userId);

        const transactions = await Transaction.find(filter)
            .sort({ date: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        console.log('✅ Found', transactions.length, 'transactions');
        res.json(transactions);
    } catch (err) {
        console.error('❌ Transaction fetch error:', err.message);
        res.status(500).json({ message: 'Failed to fetch transactions' });
    }
});

// Categories
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await Transaction.distinct('category', { userId: req.user.userId });
        res.json({ categories });
    } catch (err) {
        console.error('❌ Categories fetch error:', err.message);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
});

// Upload PDF receipt
app.post('/api/upload/pdf', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('📄 Processing PDF:', req.file.originalname);

        const pdfPath = req.file.path;
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);

        // Clean up uploaded file
        fs.unlinkSync(pdfPath);

        console.log('✅ PDF processed, extracted', data.text.length, 'characters');
        console.log('📝 Extracted text preview:', data.text.substring(0, 500));
        
        // Process extracted text with AI to get transactions
        const extractedTransactions = await aiService.parseReceiptWithGemini(data.text);
        console.log('🤖 AI processing complete, found', extractedTransactions.length, 'transactions');

        if (extractedTransactions.length > 0) {
            let successCount = 0;
            
            for (const transaction of extractedTransactions) {
                try {
                    const newTransaction = new Transaction({
                        ...transaction,
                        userId: req.user.userId
                    });
                    await newTransaction.save();
                    successCount++;
                    console.log('✅ Saved transaction:', transaction.description, '→', transaction.amount);
                } catch (err) {
                    console.error('❌ Failed to save transaction:', err.message);
                }
            }
            
            if (successCount > 0) {
                res.json({
                    message: `Successfully processed receipt! Added ${successCount} transaction(s) with AI categorization.`,
                    transactionsAdded: successCount,
                    text: data.text
                });
            } else {
                res.status(400).json({ message: 'Failed to add transactions to database' });
            }
        } else {
            res.json({
                message: 'Receipt processed but no valid transactions were detected.',
                text: data.text
            });
        }
    } catch (err) {
        console.error('❌ PDF processing error:', err.message);
        res.status(500).json({ message: 'Failed to process PDF' });
    }
});

// ------------------------ Chart APIs ------------------------

// Group expenses by category (for pie chart)
app.get('/api/summary/by-category', authenticateToken, async (req, res) => {
    try {
        console.log('📊 Generating category summary for user:', req.user.userId);

        const summary = await Transaction.aggregate([
            { $match: { userId: req.user.userId, type: 'expense' } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } }
        ]);

        console.log('✅ Category summary generated:', summary.length, 'categories');
        res.json(summary);
    } catch (err) {
        console.error('❌ Category summary error:', err.message);
        res.status(500).json({ message: 'Failed to aggregate by category' });
    }
});

// Group expenses by date (for line/bar chart)
app.get('/api/summary/by-date', authenticateToken, async (req, res) => {
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
});

// ------------------------ Error Handling ------------------------

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
        message: 'Internal server error',
        ...(NODE_ENV === 'development' && { error: err.message })
    });
});

// ------------------------ Server Start ------------------------

const server = app.listen(PORT, () => {
    console.log('🚀 Server starting...');
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log('📊 API endpoints available:');
    console.log('   GET  /ping');
    console.log('   POST /api/register');
    console.log('   POST /api/login');
    console.log('   GET  /api/transactions');
    console.log('   POST /api/transactions');
    console.log('   GET  /api/summary/by-category');
    console.log('   GET  /api/summary/by-date');
    console.log('   POST /api/upload/pdf');
    console.log('🎯 Ready to accept requests!');
});

// ------------------------ Graceful Shutdown ------------------------

process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    
    server.close(() => {
        console.log('✅ HTTP server closed');
    });
    
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    } catch (err) {
        console.error('❌ Error closing MongoDB:', err);
    }
    
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
});

module.exports = app;