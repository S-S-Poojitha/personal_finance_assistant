const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const aiService = require('../services/aiService');
const Transaction = require('../models/Transaction');

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads/';

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

const uploadController = {
    // Handle PDF upload and processing
    uploadPDF: async (req, res) => {
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

            // Process extracted text with AI
            const extractedTransactions = await aiService.parseReceiptWithGemini(data.text);

            if (extractedTransactions.length > 0) {
                let successCount = 0;
                
                for (const transaction of extractedTransactions) {
                    try {
                        const newTransaction = new Transaction({
                            ...transaction,
                            userId: req.user.userId
                        });
                        await newTransaction.save();
                        successCount++;
                    } catch (err) {
                        console.error('Failed to add transaction:', err);
                    }
                }
                
                if (successCount > 0) {
                    res.json({
                        message: `Successfully processed receipt! Added ${successCount} transaction(s) with AI categorization.`,
                        transactionsAdded: successCount,
                        extractedText: data.text
                    });
                } else {
                    res.status(400).json({ message: 'Failed to add transactions to database' });
                }
            } else {
                res.json({
                    message: 'Receipt processed but no valid transactions were detected.',
                    extractedText: data.text
                });
            }
        } catch (err) {
            console.error('❌ PDF processing error:', err.message);
            res.status(500).json({ message: 'Failed to process PDF' });
        }
    }
};

module.exports = {
    uploadController,
    upload
};
