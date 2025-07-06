const express = require('express');
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/transactions
router.post('/', transactionController.addTransaction);

// GET /api/transactions
router.get('/', transactionController.getTransactions);

// GET /api/transactions/categories
router.get('/categories', transactionController.getCategories);

// POST /api/transactions/autocategorize
router.post('/autocategorize', transactionController.autoCategorize);

// GET /api/transactions/summary/by-category (expenses)
router.get('/summary/by-category', transactionController.getSummaryByCategory);

// GET /api/transactions/summary/income-by-category
router.get('/summary/income-by-category', transactionController.getIncomeSummaryByCategory);

// GET /api/transactions/summary/by-date
router.get('/summary/by-date', transactionController.getSummaryByDate);

module.exports = router;
