const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log('🛤️  Auth route accessed:', req.method, req.url);
    console.log('📥 Auth route body:', req.body);
    console.log('📥 Auth route headers:', req.headers);
    next();
});

// POST /api/auth/register
router.post('/register', (req, res, next) => {
    console.log('🔔 Register route handler called');
    authController.register(req, res, next);
});

// POST /api/auth/login
router.post('/login', (req, res, next) => {
    console.log('🔔 Login route handler called');
    authController.login(req, res, next);
});

module.exports = router;
