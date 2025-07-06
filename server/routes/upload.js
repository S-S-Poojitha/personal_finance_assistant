const express = require('express');
const { uploadController, upload, imageUpload } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/upload/pdf
router.post('/pdf', upload.single('file'), uploadController.uploadPDF);

// POST /api/upload/image - for image OCR processing
router.post('/image', imageUpload.single('file'), uploadController.uploadImage);

module.exports = router;
