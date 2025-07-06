const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
    // Register new user
    register: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            // Input validation
            if (!username || !email || !password) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            if (password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters' });
            }

            console.log('📝 Registration attempt for:', username);

            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

            const user = new User({ 
                userId, 
                username, 
                email, 
                password: hashedPassword 
            });
            
            await user.save();

            console.log('✅ User registered successfully:', username);
            res.status(201).json({ message: 'User registered successfully' });
        } catch (err) {
            console.error('❌ Registration error:', err.message);
            
            if (err.code === 11000) {
                const field = Object.keys(err.keyPattern)[0];
                return res.status(400).json({ message: `${field} already exists` });
            }
            
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
