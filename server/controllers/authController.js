const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
    // Register new user
    register: async (req, res) => {
        try {
            console.log('🔔 Registration request received at:', new Date().toISOString());
            console.log('📥 Request headers:', req.headers);
            console.log('📦 Raw request body:', req.body);
            
            const { username, email, password } = req.body;

            console.log('📝 Registration attempt for:', username, 'with email:', email);
            console.log('📦 Request body received:', { username: !!username, email: !!email, password: !!password });

            // Input validation
            if (!username || !email || !password) {
                console.log('❌ Missing required fields');
                console.log('🔍 Validation details:', { username: !username, email: !email, password: !password });
                return res.status(400).json({ message: 'All fields are required' });
            }

            if (password.length < 6) {
                console.log('❌ Password too short:', password.length, 'characters');
                return res.status(400).json({ message: 'Password must be at least 6 characters' });
            }

            console.log('🔍 Checking for existing users...');
            // Check for existing user
            const existingUser = await User.findOne({ 
                $or: [{ username }, { email }] 
            });
            
            if (existingUser) {
                const duplicateField = existingUser.username === username ? 'username' : 'email';
                console.log('❌ Duplicate field:', duplicateField, 'for existing user:', existingUser.username);
                return res.status(400).json({ message: `${duplicateField} already exists` });
            }

            console.log('✅ No existing user found, proceeding with registration...');

            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
            console.log('🔐 Hashing password with salt rounds:', saltRounds);
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

            console.log('💾 Creating user document...');
            const user = new User({ 
                userId, 
                username, 
                email, 
                password: hashedPassword 
            });
            
            console.log('📤 Saving user to database...');
            await user.save();

            console.log('✅ User registered successfully:', username, 'with userId:', userId);
            res.status(201).json({ message: 'User registered successfully' });
        } catch (err) {
            console.error('❌ Registration error details:', {
                message: err.message,
                name: err.name,
                code: err.code,
                keyPattern: err.keyPattern,
                keyValue: err.keyValue,
                stack: err.stack.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
            });
            
            if (err.code === 11000) {
                const field = Object.keys(err.keyPattern || {})[0];
                console.log('🔍 MongoDB duplicate key error for field:', field);
                return res.status(400).json({ message: `${field} already exists` });
            }
            
            if (err.name === 'ValidationError') {
                console.log('🔍 MongoDB validation error:', err.errors);
                return res.status(400).json({ message: 'Validation failed', details: err.errors });
            }
            
            console.log('🔍 Generic error response being sent');
            res.status(400).json({ message: 'Registration failed', error: err.message });
        }
    },

    // Login user
    login: async (req, res) => {
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
            const token = jwt.sign(
                { id: user._id, userId: user.userId }, 
                process.env.JWT_SECRET, 
                { expiresIn: tokenExpiry }
            );

            console.log('✅ Login successful for:', username);
            res.json({ token, userId: user.userId });
        } catch (err) {
            console.error('❌ Login error:', err.message);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = authController;
