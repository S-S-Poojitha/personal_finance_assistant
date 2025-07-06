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

        // ✅ Use userId instead of _id
        const user = await User.findOne({ userId: decoded.userId });
        if (!user) {
            return res.status(401).json({ error: 'Token is not valid' });
        }

        req.user = decoded; // contains both `id` and `userId`
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = auth;
