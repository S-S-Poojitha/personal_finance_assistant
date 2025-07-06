const fs = require('fs');
const pdfParse = require('pdf-parse');
const axios = require('axios');

// Replace this with your actual key
const GEMINI_API_KEY = 'AIzaSyDxG_Dn27XZ-OSeg_iWbGduohqD9gYrGiI';
const MODEL = 'gemini-2.0-flash';

async function sendToGemini(promptText) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await axios.post(url, {
        contents: [
            {
                parts: [{ text: promptText }]
            }
        ]
    });

    const message = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!message) throw new Error('No response from Gemini');
    return message.trim();
}

function buildPrompt(line) {
    return `
You're a finance assistant. Extract structured transaction data from this receipt line:

"${line}"

Respond only with JSON in the format:
{
  "description": "",
  "amount": 0,
  "category": "",
  "type": "income" | "expense",
  "date": "YYYY-MM-DD"
}

If not a transaction, return:
{ "skip": true }
`.trim();
}

async function processReceiptPDF(pdfPath) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        const lines = data.text.split('\n').map(line => line.trim()).filter(Boolean);

        const transactions = [];

        for (const line of lines) {
            try {
                const prompt = buildPrompt(line);
                const raw = await sendToGemini(prompt);

                const jsonMatch = raw.match(/\{[\s\S]*?\}/);
                if (!jsonMatch) throw new Error('No JSON object found in response');

                const parsed = JSON.parse(jsonMatch[0]);

                if (!parsed.skip) {
                    transactions.push(parsed);
                    console.log('✅ Parsed:', parsed);
                } else {
                    console.log('⏩ Skipped:', line);
                }
            } catch (err) {
                console.warn(`⚠️ Error on "${line}": ${err.message}`);
            }
        }

        console.log('\n🧾 Final Transactions:\n', JSON.stringify(transactions, null, 2));
        return transactions;

    } catch (err) {
        console.error('❌ PDF processing failed:', err.message);
    }
}

// Update this path to your actual file
processReceiptPDF('./100 (1).pdf');
