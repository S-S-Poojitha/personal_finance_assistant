const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const aiService = require('../services/aiService');
const Transaction = require('../models/Transaction');

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads/';

// Storage configuration for PDFs
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Storage configuration for images
const imageStorage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, 'img-' + Date.now() + '-' + file.originalname);
    }
});

// PDF upload configuration
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

// Image upload configuration
const imageUpload = multer({ 
    storage: imageStorage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, JPG, and WebP image files are allowed'), false);
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
            
            // Debug: Log the first 500 characters to see what was extracted
            console.log('📝 Extracted text preview:');
            console.log(data.text.substring(0, 500));
            console.log('...');

            // Process extracted text with AI
            const extractedTransactions = await aiService.parseReceiptWithGemini(data.text);
            
            console.log('🤖 AI processing result:', extractedTransactions.length, 'transactions found');

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
    },

    // Handle image upload and OCR processing
    uploadImage: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image file uploaded' });
            }

            console.log('🖼️ Processing image:', req.file.originalname);
            console.log('📁 Image path:', req.file.path);
            console.log('📏 Image size:', req.file.size, 'bytes');

            // Check if Gemini API is available
            if (!process.env.GEMINI_API_KEY) {
                console.log('⚠️ GEMINI_API_KEY not available, cannot process image');
                // Clean up uploaded file
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ message: 'Image OCR service not available' });
            }

            // Process image with Gemini Vision API
            const extractedText = await aiService.processImageWithGemini(req.file.path);
            
            // Clean up uploaded file after processing
            fs.unlinkSync(req.file.path);

            if (!extractedText || extractedText.trim().length === 0) {
                console.log('⚠️ No text extracted from image');
                return res.json({
                    message: 'Image processed but no text was detected.',
                    extractedText: ''
                });
            }

            console.log('✅ Image OCR completed, extracted', extractedText.length, 'characters');
            
            // Debug: Log the first 500 characters to see what was extracted
            console.log('📝 Extracted text preview:');
            console.log(extractedText.substring(0, 500));
            console.log('...');

            // Process extracted text with AI to find transactions
            const extractedTransactions = await aiService.parseReceiptWithGemini(extractedText);
            
            console.log('🤖 AI processing result:', extractedTransactions.length, 'transactions found');

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
                        console.log('💾 Saved transaction:', transaction.description, transaction.amount);
                    } catch (err) {
                        console.error('❌ Failed to save transaction:', err.message);
                    }
                }
                
                if (successCount > 0) {
                    res.json({
                        message: `Successfully processed receipt image! Added ${successCount} transaction(s) with AI categorization.`,
                        transactionsAdded: successCount,
                        extractedText: extractedText
                    });
                } else {
                    res.status(400).json({ 
                        message: 'Failed to save transactions to database',
                        extractedText: extractedText
                    });
                }
            } else {
                res.json({
                    message: 'Image processed but no valid transactions were detected.',
                    extractedText: extractedText
                });
            }
        } catch (err) {
            console.error('❌ Image processing error:', err.message);
            console.error('🔍 Error details:', err);
            
            // Clean up uploaded file if it still exists
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (cleanupErr) {
                    console.error('❌ Failed to clean up file:', cleanupErr.message);
                }
            }
            
            res.status(500).json({ 
                message: 'Failed to process image',
                error: err.message
            });
        }
    }
};

module.exports = {
    uploadController,
    upload,
    imageUpload
};
