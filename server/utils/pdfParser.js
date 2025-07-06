// server/utils/pdfParser.js
const pdf = require('pdf-parse');
const fs = require('fs');

/**
 * Extract transaction table from PDF
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<object>} - Extracted transaction data
 */
const extractTableFromPDF = async (pdfPath) => {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);

        const transactions = parseTransactionTable(data.text);

        return {
            success: true,
            transactions,
            totalPages: data.numpages,
            text: data.text
        };
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to parse PDF');
    }
};

/**
 * Parse transaction table from PDF text
 * @param {string} text - Raw PDF text
 * @returns {array} - Array of transaction objects
 */
const parseTransactionTable = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const transactions = [];

    // Common patterns for transaction data
    const patterns = {
        // Match date patterns (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
        date: /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
        // Match amounts (with optional currency symbols)
        amount: /[\$£€]?([0-9,]+\.?[0-9]*)/,
        // Match negative amounts (withdrawals/debits)
        negative: /[-\(\$£€]([0-9,]+\.?[0-9]*)\)?/,
        // Common transaction types
        debit: /debit|withdrawal|purchase|payment|transfer|fee/i,
        credit: /credit|deposit|income|salary|refund/i
    };

    let currentTransaction = null;
    let headerFound = false;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) return;

        // Look for table headers
        if (!headerFound && isTableHeader(trimmedLine)) {
            headerFound = true;
            return;
        }

        // If we haven't found headers yet, skip
        if (!headerFound) return;

        // Try to parse as transaction line
        const transactionData = parseTransactionLine(trimmedLine);

        if (transactionData) {
            transactions.push(transactionData);
        }
    });

    return transactions;
};

/**
 * Check if line contains table headers
 * @param {string} line - Line to check
 * @returns {boolean} - True if line contains headers
 */
const isTableHeader = (line) => {
    const headerKeywords = [
        'date', 'description', 'amount', 'balance', 'debit', 'credit',
        'transaction', 'reference', 'type', 'category', 'merchant'
    ];

    const lineLower = line.toLowerCase();
    let keywordCount = 0;

    headerKeywords.forEach(keyword => {
        if (lineLower.includes(keyword)) {
            keywordCount++;
        }
    });

    return keywordCount >= 2;
};

/**
 * Parse individual transaction line
 * @param {string} line - Transaction line
 * @returns {object|null} - Parsed transaction or null
 */
const parseTransactionLine = (line) => {
    const patterns = {
        date: /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
        amount: /[\$£€]?([0-9,]+\.?[0-9]*)/g,
        negative: /[-\(\$£€]([0-9,]+\.?[0-9]*)\)?/
    };

    // Extract date
    const dateMatch = line.match(patterns.date);
    if (!dateMatch) return null;

    // Extract amounts
    const amounts = [];
    let match;
    while ((match = patterns.amount.exec(line)) !== null) {
        amounts.push(parseFloat(match[1].replace(/,/g, '')));
    }

    if (amounts.length === 0) return null;

    // Determine transaction type and amount
    let amount = amounts[amounts.length - 1]; // Usually the last amount is the transaction amount
    let type = 'expense';

    // Check for negative indicators
    if (patterns.negative.test(line)) {
        type = 'expense';
    } else if (line.toLowerCase().includes('credit') || line.toLowerCase().includes('deposit')) {
        type = 'income';
    }

    // Extract description (everything between date and amount)
    const dateString = dateMatch[0];
    const dateIndex = line.indexOf(dateString);
    const amountString = amounts[amounts.length - 1].toString();
    const amountIndex = line.lastIndexOf(amountString);

    let description = line.substring(dateIndex + dateString.length, amountIndex).trim();

    // Clean up description
    description = description.replace(/[\$£€\-\(\)]/g, '').trim();
    if (!description) description = 'Transaction';

    // Determine category
    const category = categorizeTransactionFromDescription(description);

    return {
        type,
        amount,
        category,
        description,
        date: new Date(dateMatch[1])
    };
};

/**
 * Categorize transaction based on description
 * @param {string} description - Transaction description
 * @returns {string} - Category
 */
const categorizeTransactionFromDescription = (description) => {
    const descLower = description.toLowerCase();

    // Food & Dining
    if (descLower.includes('restaurant') || descLower.includes('cafe') ||
        descLower.includes('pizza') || descLower.includes('food') ||
        descLower.includes('dining') || descLower.includes('mcdonalds') ||
        descLower.includes('starbucks') || descLower.includes('subway')) {
        return 'Food & Dining';
    }

    // Groceries
    if (descLower.includes('grocery') || descLower.includes('supermarket') ||
        descLower.includes('walmart') || descLower.includes('target') ||
        descLower.includes('kroger') || descLower.includes('safeway') ||
        descLower.includes('whole foods') || descLower.includes('costco')) {
        return 'Groceries';
    }

    // Transportation
    if (descLower.includes('gas') || descLower.includes('fuel') ||
        descLower.includes('shell') || descLower.includes('bp') ||
        descLower.includes('uber') || descLower.includes('lyft') ||
        descLower.includes('taxi') || descLower.includes('bus') ||
        descLower.includes('train') || descLower.includes('airline')) {
        return 'Transportation';
    }

    // Bills & Utilities
    if (descLower.includes('electric') || descLower.includes('water') ||
        descLower.includes('gas bill') || descLower.includes('internet') ||
        descLower.includes('phone') || descLower.includes('utility') ||
        descLower.includes('comcast') || descLower.includes('verizon') ||
        descLower.includes('att') || descLower.includes('spectrum')) {
        return 'Bills & Utilities';
    }

    // Banking & Fees
    if (descLower.includes('fee') || descLower.includes('charge') ||
        descLower.includes('atm') || descLower.includes('bank') ||
        descLower.includes('overdraft') || descLower.includes('maintenance')) {
        return 'Banking Fees';
    }

    // Healthcare
    if (descLower.includes('pharmacy') || descLower.includes('hospital') ||
        descLower.includes('clinic') || descLower.includes('medical') ||
        descLower.includes('doctor') || descLower.includes('cvs') ||
        descLower.includes('walgreens') || descLower.includes('rite aid')) {
        return 'Healthcare';
    }

    // Shopping
    if (descLower.includes('amazon') || descLower.includes('ebay') ||
        descLower.includes('store') || descLower.includes('shop') ||
        descLower.includes('retail') || descLower.includes('mall')) {
        return 'Shopping';
    }

    // Entertainment
    if (descLower.includes('movie') || descLower.includes('theater') ||
        descLower.includes('netflix') || descLower.includes('spotify') ||
        descLower.includes('hulu') || descLower.includes('disney') ||
        descLower.includes('entertainment') || descLower.includes('games')) {
        return 'Entertainment';
    }

    // Subscriptions
    if (descLower.includes('subscription') || descLower.includes('monthly') ||
        descLower.includes('annual') || descLower.includes('recurring')) {
        return 'Subscriptions';
    }

    // Income
    if (descLower.includes('salary') || descLower.includes('payroll') ||
        descLower.includes('deposit') || descLower.includes('income') ||
        descLower.includes('wage') || descLower.includes('payment received')) {
        return 'Salary';
    }

    return 'Uncategorized';
};

module.exports = {
    extractTableFromPDF,
    parseTransactionTable,
    parseTransactionLine,
    categorizeTransactionFromDescription
};