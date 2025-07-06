const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('🔐 Auth header:', authHeader);
    console.log('🔐 Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('❌ Token verification failed:', err.message);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        console.log('✅ Token decoded:', decoded);
        req.user = { id: decoded.id, userId: decoded.userId };
        console.log('✅ req.user set to:', req.user);
        next();
    });
};

const requestLogger = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`📥 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    }
    next();
};

const errorHandler = (err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    
    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large' });
    }
    
    if (err.message === 'Only PDF files are allowed') {
        return res.status(400).json({ message: 'Only PDF files are allowed' });
    }
    
    res.status(500).json({ 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
};

module.exports = {
    authenticateToken,
    requestLogger,
    errorHandler
};
