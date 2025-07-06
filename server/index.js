// // personal-finance-assistant/server/index.js
//
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
//
// const app = express();
// const PORT = 8000;
// const JWT_SECRET = 'your_jwt_secret_key';
//
// // ------------------------ MongoDB Connection ------------------------
//
// mongoose.connect('mongodb+srv://sarvamangalapoojitha:mongo@cluster1.xkopp.mongodb.net/Finance?retryWrites=true&w=majority')
//     .then(() => console.log('Connected to MongoDB Atlas'))
//     .catch((err) => console.error('MongoDB connection error:', err));
//
// mongoose.connection.on('connected', () => {
//     console.log('Mongoose connected to DB:', mongoose.connection.name);
// });
//
// // ------------------------ Schemas ------------------------
//
// const userSchema = new mongoose.Schema({
//     userId: { type: String, unique: true, required: true }, // Add this line
//     username: { type: String, unique: true, required: true },
//     email: { type: String, unique: true, required: true },
//     password: { type: String, required: true }
// });
// const transactionSchema = new mongoose.Schema({
//     userId: { type: String, required: true },
//     type: String,
//     amount: Number,
//     category: String,
//     description: String,
//     date: { type: Date, default: Date.now }
// });
//
// const aggregateSchema = new mongoose.Schema({
//     userId: { type: String, required: true },
//     month: String,
//     income: Number,
//     expense: Number,
//     byCategory: [{ category: String, total: Number }],
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now }
// });
//
// aggregateSchema.pre('save', function (next) {
//     this.updatedAt = Date.now();
//     next();
// });
//
// const User = mongoose.model('User', userSchema, 'user');
// const Transaction = mongoose.model('Transaction', transactionSchema, 'transactions');
// const Aggregate = mongoose.model('Aggregate', aggregateSchema);
//
// // ------------------------ Middleware ------------------------
//
// app.use(cors());
// app.use(express.json());
//
// function authenticateToken(req, res, next) {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
//     if (!token) return res.sendStatus(401);
//
//     jwt.verify(token, JWT_SECRET, (err, decoded) => {
//         if (err) return res.sendStatus(403);
//         req.user = { id: decoded.id, userId: decoded.userId };
//         next();
//     });
// }
//
// // ------------------------ File Upload ------------------------
//
// const storage = multer.diskStorage({
//     destination: './uploads/',
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname);
//     }
// });
// const upload = multer({ storage });
//
// // ------------------------ Routes ------------------------
//
// app.get('/ping', (req, res) => {
//     res.send('pong');
// });
//
// // Register
// app.post('/api/register', async (req, res) => {
//     try {
//         const { username, email, password } = req.body;
//         const hashed = await bcrypt.hash(password, 10);
//         const userId = bcrypt.genSaltSync(10).slice(-12);
//         const user = new User({ userId, username, email, password: hashed });
//         await user.save();
//         res.json({ message: 'User registered' });
//     } catch (err) {
//         res.status(400).json({ message: 'Registration failed', error: err.message });
//     }
// });
//
// // Login
// app.post('/api/login', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const user = await User.findOne({ username });
//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }
//         const token = jwt.sign({ id: user._id, userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });
//         res.json({ token, userId: user.userId });
//     } catch (err) {
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });
//
// // Auto-categorization
// app.post('/api/autocategorize', authenticateToken, async (req, res) => {
//     const { description } = req.body;
//
//     try {
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
//
// Return only the category as one of:
// - Food
// - Groceries
// - Transport
// - Healthcare
// - Entertainment
// - Taxes (for GST, tax, etc.)
// - Summary (for Subtotal, Total lines)
// - Income
// - Rent
// - Bills & Utilities
// - Other
//
// If it’s unclear, return "Uncategorized".
//                 `.trim()
//                             }
//                         ]
//                     }
//                 ]
//             }
//         );
//
//         const output = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
//         const category = output || 'Uncategorized';
//
//         res.json({ category });
//     } catch (err) {
//         console.error('Auto-categorization error:', err.message);
//         res.status(500).json({ message: 'Auto-categorization failed' });
//     }
// });
//
// // Add transaction
// app.post('/api/transactions', authenticateToken, async (req, res) => {
//     try {
//         const tx = new Transaction({ ...req.body, userId: req.user.userId });
//         await tx.save();
//         res.json({ message: 'Transaction added', data: tx });
//     } catch (err) {
//         res.status(500).json({ message: 'Failed to add transaction' });
//     }
// });
//
// // List transactions
// app.get('/api/transactions', authenticateToken, async (req, res) => {
//     try {
//         const { page = 1, limit = 10, start, end } = req.query;
//         const filter = { userId: req.user.userId };
//         if (start && end) {
//             filter.date = { $gte: new Date(start), $lte: new Date(end) };
//         }
//         const transactions = await Transaction.find(filter)
//             .sort({ date: -1 })
//             .skip((page - 1) * limit)
//             .limit(Number(limit));
//         res.json(transactions);
//     } catch (err) {
//         res.status(500).json({ message: 'Failed to fetch transactions' });
//     }
// });
//
// // Categories
// app.get('/api/categories', authenticateToken, async (req, res) => {
//     try {
//         const categories = await Transaction.distinct('category', { userId: req.user.userId });
//         res.json({ categories });
//     } catch (err) {
//         res.status(500).json({ message: 'Failed to fetch categories' });
//     }
// });
//
// // HTML Categories
// app.get('/api/categories/html', authenticateToken, async (req, res) => {
//     try {
//         const categories = await Transaction.distinct('category', { userId: req.user.userId });
//         const html = `
//             <label for="category">Category:</label>
//             <select name="category" id="category">
//                 ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
//             </select>`;
//         res.send(html);
//     } catch (err) {
//         res.status(500).send('<p>Failed to load categories</p>');
//     }
// });
//
// // Upload PDF receipt
// app.post('/api/upload/pdf', authenticateToken, upload.single('file'), async (req, res) => {
//     try {
//         const pdfPath = req.file.path;
//         const dataBuffer = fs.readFileSync(pdfPath);
//         const data = await pdfParse(dataBuffer);
//         fs.unlinkSync(pdfPath);
//         res.json({ text: data.text });
//     } catch (err) {
//         res.status(500).json({ message: 'Failed to process PDF' });
//     }
// });
//
// // ------------------------ Chart APIs ------------------------
//
// // Group expenses by category (for pie chart)
// app.get('/api/summary/by-category', authenticateToken, async (req, res) => {
//     try {
//         const summary = await Transaction.aggregate([
//             { $match: { userId: req.user.userId, type: 'expense' } },
//             { $group: { _id: "$category", total: { $sum: "$amount" } } },
//             { $sort: { total: -1 } }
//         ]);
//         res.json(summary);
//     } catch (err) {
//         res.status(500).json({ message: 'Failed to aggregate by category' });
//     }
// });
//
// // Group expenses by date (for line/bar chart)
// app.get('/api/summary/by-date', authenticateToken, async (req, res) => {
//     try {
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
//         res.json(summary);
//     } catch (err) {
//         res.status(500).json({ message: 'Failed to aggregate by date' });
//     }
// });
//
// // ------------------------ Server Start ------------------------
//
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });
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
const PORT = 8000;
const JWT_SECRET = 'your_jwt_secret_key';

// ------------------------ MongoDB Connection with Timeout ------------------------

const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    family: 4 // Use IPv4, skip trying IPv6
};

// Your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://sarvamangalapoojitha:mongo@cluster1.xkopp.mongodb.net/Finance?retryWrites=true&w=majority';

console.log('🔄 Attempting to connect to MongoDB...');

mongoose.connect(MONGODB_URI, mongoOptions)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');
        console.log('📊 Database:', mongoose.connection.name);
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

// ------------------------ Middleware ------------------------

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
    console.log('📁 Created uploads directory');
}

// ------------------------ Routes ------------------------

// Health check route (this should be fast)
app.get('/ping', (req, res) => {
    console.log('🏓 Ping received at:', new Date().toISOString());
    res.json({
        message: 'pong',
        timestamp: new Date().toISOString(),
        server: 'Personal Finance API'
    });
});

// Basic info route
app.get('/', (req, res) => {
    res.json({
        message: 'Personal Finance Assistant API',
        status: 'running',
        endpoints: ['/ping', '/api/register', '/api/login', '/api/transactions']
    });
});

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log('📝 Registration attempt for:', username);

        const hashed = await bcrypt.hash(password, 10);
        const userId = bcrypt.genSaltSync(10).slice(-12);

        const user = new User({ userId, username, email, password: hashed });
        await user.save();

        console.log('✅ User registered successfully:', username);
        res.json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('❌ Registration error:', err.message);
        res.status(400).json({ message: 'Registration failed', error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('🔐 Login attempt for:', username);

        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log('❌ Invalid credentials for:', username);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });

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

    try {
        console.log('🤖 Auto-categorizing:', description);

        const response = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDxG_Dn27XZ-OSeg_iWbGduohqD9gYrGiI',
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
            }
        );

        const output = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        const category = output || 'Uncategorized';

        console.log('✅ Categorized as:', category);
        res.json({ category });
    } catch (err) {
        console.error('❌ Auto-categorization error:', err.message);
        res.status(500).json({ message: 'Auto-categorization failed' });
    }
});

// Add transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        console.log('💰 Adding transaction for user:', req.user.userId);

        const tx = new Transaction({ ...req.body, userId: req.user.userId });
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

        if (start && end) {
            filter.date = { $gte: new Date(start), $lte: new Date(end) };
        }

        console.log('📋 Fetching transactions for user:', req.user.userId);

        const transactions = await Transaction.find(filter)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

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
        res.json({ text: data.text });
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

// ------------------------ Server Start ------------------------

app.listen(PORT, () => {
    console.log('🚀 Server starting...');
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    console.log('📊 API endpoints available:');
    console.log('   GET  /ping');
    console.log('   POST /api/register');
    console.log('   POST /api/login');
    console.log('   GET  /api/transactions');
    console.log('   POST /api/transactions');
    console.log('🎯 Ready to accept requests!');
});

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});
