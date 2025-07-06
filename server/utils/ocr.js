// server/utils/ocr.js
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');

/**
 * Extract text from image using OCR
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<object>} - Extracted transaction data
 */
const extractTextFromImage = async (imagePath) => {
    try {
        // Preprocess image for better OCR accuracy
        const processedImagePath = imagePath.replace(/\.[^/.]+$/, '_processed.jpg');

        await sharp(imagePath)
            .grayscale()
            .normalize()
            .sharpen()
            .jpeg({ quality: 90 })
            .toFile(processedImagePath);

        // Extract text using Tesseract
        const { data: { text } } = await Tesseract.recognize(processedImagePath, 'eng', {
            logger: m => console.log(m)
        });

        // Clean up processed image
        if (fs.existsSync(processedImagePath)) {
            fs.unlinkSync(processedImagePath);
        }

        // Parse the extracted text
        const transactionData = parseReceiptText(text);

        return transactionData;
    } catch (error) {
        console.error('OCR processing error:', error);
        throw new Error('Failed to process image');
    }
};

/**
 * Parse receipt text to extract transaction information
 * @param {string} text - Raw OCR text
 * @returns {object} - Parsed transaction data
 */
const parseReceiptText = (text) => {
    try {
        const lines = text.split('\n').filter(line => line.trim());

        // Initialize transaction data
        const transactionData = {
            type: 'expense',
            amount: 0,
            category: 'Uncategorized',
            description: '',
            items: [],
            merchant: '',
            date: new Date()
        };

        // Patterns for common receipt elements
        const patterns = {
            total: /(?:total|amount|sum)[\s:$]*([0-9]+\.?[0-9]*)/i,
            date: /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
            merchant: /^[A-Z\s&]+$/,
            item: /^(.+?)\s+\$?([0-9]+\.?[0-9]*)$/,
            currency: /\$([0-9]+\.?[0-9]*)/g
        };

        // Extract merchant name (usually first few lines)
        for (let i = 0; i < Math.min(3, lines.length); i++) {
            if (patterns.merchant.test(lines[i]) && lines[i].length > 2) {
                transactionData.merchant = lines[i].trim();
                break;
            }
        }

        // Extract date
        const dateMatch = text.match(patterns.date);
        if (dateMatch) {
            transactionData.date = new Date(dateMatch[1]);
        }

        // Extract total amount
        const totalMatch = text.match(patterns.total);
        if (totalMatch) {
            transactionData.amount = parseFloat(totalMatch[1]);
        }

        // Extract individual items
        lines.forEach(line => {
            const itemMatch = line.match(patterns.item);
            if (itemMatch) {
                transactionData.items.push({
                    description: itemMatch[1].trim(),
                    amount: parseFloat(itemMatch[2])
                });
            }
        });

        // If no total found, sum up items
        if (transactionData.amount === 0 && transactionData.items.length > 0) {
            transactionData.amount = transactionData.items.reduce((sum, item) => sum + item.amount, 0);
        }

        // Set category based on merchant or items
        transactionData.category = categorizeTransaction(transactionData.merchant, transactionData.items);

        // Set description
        transactionData.description = transactionData.merchant || 'Receipt transaction';

        return transactionData;
    } catch (error) {
        console.error('Receipt parsing error:', error);
        return {
            type: 'expense',
            amount: 0,
            category: 'Uncategorized',
            description: 'Failed to parse receipt',
            items: [],
            merchant: '',
            date: new Date()
        };
    }
};

/**
 * Categorize transaction based on merchant and items
 * @param {string} merchant - Merchant name
 * @param {array} items - Array of items
 * @returns {string} - Category
 */
const categorizeTransaction = (merchant, items) => {
    const merchantLower = merchant.toLowerCase();

    // Food & Dining
    if (merchantLower.includes('restaurant') || merchantLower.includes('cafe') ||
        merchantLower.includes('pizza') || merchantLower.includes('burger') ||
        merchantLower.includes('food') || merchantLower.includes('dining')) {
        return 'Food & Dining';
    }

    // Groceries
    if (merchantLower.includes('grocery') || merchantLower.includes('market') ||
        merchantLower.includes('walmart') || merchantLower.includes('target') ||
        merchantLower.includes('kroger') || merchantLower.includes('safeway')) {
        return 'Groceries';
    }

    // Transportation
    if (merchantLower.includes('gas') || merchantLower.includes('fuel') ||
        merchantLower.includes('station') || merchantLower.includes('uber') ||
        merchantLower.includes('taxi') || merchantLower.includes('transport')) {
        return 'Transportation';
    }

    // Shopping
    if (merchantLower.includes('mall') || merchantLower.includes('store') ||
        merchantLower.includes('shop') || merchantLower.includes('retail')) {
        return 'Shopping';
    }

    // Entertainment
    if (merchantLower.includes('movie') || merchantLower.includes('theater') ||
        merchantLower.includes('cinema') || merchantLower.includes('entertainment')) {
        return 'Entertainment';
    }

    // Healthcare
    if (merchantLower.includes('pharmacy') || merchantLower.includes('hospital') ||
        merchantLower.includes('clinic') || merchantLower.includes('medical')) {
        return 'Healthcare';
    }

    return 'Uncategorized';
};

module.exports = {
    extractTextFromImage,
    parseReceiptText,
    categorizeTransaction
};