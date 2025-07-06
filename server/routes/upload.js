const express = require('express');
const { uploadController, upload } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/upload/pdf
router.post('/pdf', upload.single('file'), uploadController.uploadPDF);

module.exports = router;
