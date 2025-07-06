const axios = require('axios');

const predefinedCategories = {
    income: [
        'Salary', 'Freelance', 'Business Income', 'Investment Returns', 
        'Dividend', 'Interest', 'Rental Income', 'Gift Money', 
        'Bonus', 'Commission', 'Other Income'
    ],
    expense: [
        'Food & Dining', 'Groceries', 'Transportation', 'Fuel', 
        'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 
        'Education', 'Travel', 'Rent', 'Insurance', 'Subscriptions',
        'Personal Care', 'Clothing', 'Electronics', 'Home & Garden',
        'Sports & Fitness', 'Gifts & Donations', 'Banking Fees', 
        'Taxes', 'GST', 'EMI', 'Maintenance', 'Uncategorized'
    ]
};

const aiService = {
    // Smart local categorization as fallback
    smartCategorize: (description, transactionType = 'expense') => {
        const desc = description.toLowerCase();
        
        const categoryKeywords = {
            'Salary': ['salary', 'wages', 'pay', 'income', 'earnings', 'stipend'],
            'Freelance': ['freelance', 'freelancing', 'contract', 'gig', 'project payment'],
            'Business Income': ['business', 'profit', 'revenue', 'sales', 'commission'],
            'Investment Returns': ['dividend', 'interest', 'returns', 'mutual fund', 'stocks', 'sip'],
            'Rental Income': ['rent received', 'rental', 'tenant', 'property income'],
            'Gift Money': ['gift', 'present', 'birthday money', 'festival money'],
            'Bonus': ['bonus', 'incentive', 'reward', 'extra pay'],
            
            'Food & Dining': ['food', 'restaurant', 'cafe', 'dinner', 'lunch', 'breakfast', 'meal', 'eating', 'pizza', 'burger', 'coffee', 'tea', 'dining', 'swiggy', 'zomato', 'biryani', 'dosa', 'idli'],
            'Groceries': ['grocery', 'supermarket', 'vegetables', 'fruits', 'milk', 'bread', 'rice', 'dal', 'market', 'store', 'shopping', 'reliance fresh', 'big bazaar', 'sabzi'],
            'Transportation': ['fuel', 'gas', 'petrol', 'diesel', 'uber', 'ola', 'taxi', 'bus', 'train', 'metro', 'parking', 'toll', 'auto', 'rickshaw', 'cab', 'irctc'],
            'Bills & Utilities': ['electricity', 'water', 'gas bill', 'internet', 'wifi', 'mobile bill', 'phone bill', 'utility', 'maintenance', 'society maintenance', 'broadband', 'postpaid', 'prepaid'],
            'Healthcare': ['medicine', 'pharmacy', 'doctor', 'hospital', 'clinic', 'medical', 'health', 'tablet', 'injection', 'checkup', 'apollo', 'medicine', 'consultation'],
            'Entertainment': ['movie', 'cinema', 'game', 'sports', 'entertainment', 'netflix', 'amazon prime', 'hotstar', 'music', 'concert', 'pvr', 'inox', 'bookmyshow'],
            'Education': ['school', 'college', 'university', 'course', 'book', 'tuition', 'fees', 'education', 'study', 'training', 'coaching', 'exam fees'],
            'Shopping': ['shopping', 'clothes', 'shirt', 'shoes', 'electronics', 'mobile', 'laptop', 'amazon', 'flipkart', 'online', 'myntra', 'ajio'],
            'Travel': ['hotel', 'flight', 'booking', 'travel', 'vacation', 'trip', 'tourism', 'ticket', 'makemytrip', 'goibibo', 'oyo'],
            'Rent': ['rent', 'house rent', 'apartment', 'flat', 'accommodation', 'pg', 'hostel'],
            'Insurance': ['insurance', 'premium', 'policy', 'lic', 'health insurance', 'car insurance'],
            'EMI': ['emi', 'loan', 'installment', 'monthly payment', 'home loan', 'car loan', 'personal loan'],
            'GST': ['gst', 'tax', 'service tax', 'cgst', 'sgst', 'igst', 'tds'],
            'Banking Fees': ['bank', 'atm', 'charges', 'fees', 'penalty', 'interest', 'annual charges'],
            'Subscriptions': ['subscription', 'monthly plan', 'annual plan', 'membership', 'gym', 'spotify', 'youtube premium']
        };
        
        const incomeKeywords = ['received', 'credited', 'income', 'salary', 'payment received', 'deposit', 'refund'];
        const expenseKeywords = ['paid', 'debited', 'expense', 'purchase', 'bought', 'bill'];
        
        let detectedType = transactionType;
        if (incomeKeywords.some(keyword => desc.includes(keyword))) {
            detectedType = 'income';
        } else if (expenseKeywords.some(keyword => desc.includes(keyword))) {
            detectedType = 'expense';
        }
        
        const relevantCategories = detectedType === 'income' ? 
            Object.keys(categoryKeywords).filter(cat => predefinedCategories.income.includes(cat)) :
            Object.keys(categoryKeywords).filter(cat => predefinedCategories.expense.includes(cat));
        
        for (const category of relevantCategories) {
            const keywords = categoryKeywords[category] || [];
            if (keywords.some(keyword => desc.includes(keyword))) {
                return { category, type: detectedType };
            }
        }
        
        return { category: 'Uncategorized', type: detectedType };
    },

    // AI categorization using Gemini
    categorizeTransaction: async (description) => {
        // Check if Gemini API is available
        if (!process.env.GEMINI_API_KEY) {
            console.log('⚠️ Gemini API key not available, using fallback categorization');
            const result = aiService.smartCategorize(description);
            return result.category;
        }

        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `
You're a finance assistant. Categorize this transaction description:
"${description}"

Return only the category as one of:
${predefinedCategories.expense.concat(predefinedCategories.income).join(', ')}

If it's unclear, return "Uncategorized".
                                    `.trim()
                                }
                            ]
                        }
                    ]
                },
                {
                    timeout: parseInt(process.env.API_TIMEOUT) || 10000 // 10s timeout
                }
            );

            const output = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            return output || 'Uncategorized';
        } catch (err) {
            console.error('❌ Gemini API error:', err.message);
            const result = aiService.smartCategorize(description);
            return result.category;
        }
    },

    // Parse receipt with AI
    parseReceiptWithGemini: async (receiptText) => {
        console.log('🧠 Starting AI receipt parsing...');
        console.log('📝 Input text length:', receiptText.length);
        
        try {
            if (!process.env.GEMINI_API_KEY) {
                console.log('⚠️ No Gemini API key, falling back to simple parsing');
                return aiService.parseReceiptSimple(receiptText);
            }

            console.log('🤖 Calling Gemini API...');
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `
Analyze this Indian receipt/bill text and extract individual transactions:
"${receiptText}"

Extract each line item as a separate transaction. For each item, determine:
1. Description (what was purchased/paid for)
2. Amount (in rupees, extract just the number)
3. Type (income or expense - receipts are usually expenses)
4. Category from these predefined options:

EXPENSE categories: ${predefinedCategories.expense.join(', ')}
INCOME categories: ${predefinedCategories.income.join(', ')}

Rules:
- Skip totals, subtotals, taxes, and summary lines
- Only extract actual items/services
- Use Indian context for categorization
- Amount should be numeric value only
- Each transaction should be a separate object

Respond with a JSON array of transactions:
[
  {
    "description": "item description",
    "amount": 125.50,
    "type": "expense",
    "category": "Food & Dining"
  }
]

If no valid transactions found, return empty array: []
                                    `.trim()
                                }
                            ]
                        }
                    ]
                },
                {
                    timeout: parseInt(process.env.API_TIMEOUT) || 10000
                }
            );
            
            console.log('✅ Gemini API responded');
            const geminiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            console.log('🔍 Gemini response preview:', geminiText ? geminiText.substring(0, 200) : 'No response');
            
            try {
                const jsonMatch = geminiText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    console.log('📋 Found JSON in response, parsing...');
                    const transactions = JSON.parse(jsonMatch[0]);
                    console.log('✅ Parsed', transactions.length, 'raw transactions');
                    
                    const validTransactions = transactions.filter(tx => 
                        tx.description && 
                        tx.amount && 
                        typeof tx.amount === 'number' && 
                        tx.amount > 0 && 
                        tx.amount < 100000 && 
                        tx.type &&
                        tx.category &&
                        predefinedCategories[tx.type]?.includes(tx.category)
                    ).map(tx => ({
                        ...tx,
                        date: new Date().toISOString().split('T')[0]
                    }));
                    
                    console.log('✅ Filtered to', validTransactions.length, 'valid transactions');
                    return validTransactions;
                } else {
                    console.log('❌ No JSON array found in Gemini response');
                }
            } catch (parseError) {
                console.error('❌ Failed to parse Gemini response:', parseError.message);
            }
        } catch (error) {
            console.error('❌ Gemini API error:', error.message);
        }
        
        console.log('🔄 Falling back to simple parsing...');
        return aiService.parseReceiptSimple(receiptText);
    },

    // Simple receipt parsing fallback
    parseReceiptSimple: (text) => {
        console.log('🔧 Starting simple receipt parsing...');
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        console.log('📄 Processing', lines.length, 'lines');
        const transactions = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            
            const amountMatch = line.match(/(?:₹|rs\.?|\$)?\s*(\d+\.?\d*)/);
            
            if (amountMatch && !line.includes('total') && !line.includes('subtotal') && !line.includes('gst') && !line.includes('tax')) {
                const amount = parseFloat(amountMatch[1]);
                console.log('💰 Found potential amount:', amount, 'in line:', lines[i].substring(0, 50));
                
                if (amount > 0 && amount < 10000) {
                    let description = lines[i].replace(/(?:₹|rs\.?|\$)?\s*\d+\.?\d*/gi, '').trim();
                    
                    if (!description || description.length < 3) {
                        description = i > 0 ? lines[i-1] : `Item ${transactions.length + 1}`;
                    }
                    
                    const result = aiService.smartCategorize(description, 'expense');
                    console.log('✅ Added transaction:', description, '→', amount, '→', result.category);
                    
                    transactions.push({
                        type: result.type,
                        amount: amount,
                        category: result.category,
                        description: description,
                        date: new Date().toISOString().split('T')[0]
                    });
                }
            }
        }
        
        console.log('📊 Simple parsing result:', transactions.length, 'transactions found');
        return transactions;
    },

    // Process image with Gemini Vision API to extract text
    processImageWithGemini: async (imagePath) => {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured');
        }

        try {
            console.log('🖼️ Processing image with Gemini Vision API:', imagePath);

            // Read image file and convert to base64
            const fs = require('fs');
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            
            // Determine image MIME type based on file extension
            const path = require('path');
            const ext = path.extname(imagePath).toLowerCase();
            let mimeType = 'image/jpeg'; // default
            
            if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            else if (ext === '.webp') mimeType = 'image/webp';

            console.log('📷 Image details - Size:', imageBuffer.length, 'bytes, Type:', mimeType);

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: "Extract all text from this receipt/bill image. Focus on transaction details, amounts, dates, and merchant information. Return only the extracted text, nothing else."
                                },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64Image
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 2048,
                    }
                },
                {
                    timeout: 30000, // 30 seconds timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.candidates && response.data.candidates[0]) {
                const extractedText = response.data.candidates[0].content.parts[0].text;
                console.log('✅ Gemini Vision API extracted text length:', extractedText.length);
                return extractedText;
            } else {
                console.log('⚠️ No text extracted from image');
                return '';
            }
        } catch (error) {
            console.error('❌ Gemini Vision API error:', error.message);
            if (error.response) {
                console.error('📡 API Response:', error.response.status, error.response.data);
            }
            throw new Error(`Image OCR failed: ${error.message}`);
        }
    }
};

module.exports = aiService;
