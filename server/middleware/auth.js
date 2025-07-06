// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        console.log('🔍 Decoded token:', decoded);

        // Fix: Use userId field to find user (not _id)
        const user = await User.findOne({ userId: decoded.userId });
        if (!user) {
            console.log('❌ User not found with userId:', decoded.userId);
            return res.status(401).json({ error: 'Token is not valid' });
        }

        // Set both user object and userId for compatibility
        req.user = {
            ...decoded,
            userId: user.userId,
            id: user._id.toString()
        };
        console.log('✅ Auth successful for user:', req.user.userId);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = auth;
