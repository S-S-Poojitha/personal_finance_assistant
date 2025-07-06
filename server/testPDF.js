const pdfParse = require('pdf-parse');
const fs = require('fs');

async function testPDF() {
    try {
        const pdfPath = './100 (1).pdf';
        if (!fs.existsSync(pdfPath)) {
            console.log('❌ PDF file not found at:', pdfPath);
            return;
        }
        
        console.log('📄 Testing PDF parsing...');
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        
        console.log('✅ PDF parsed successfully');
        console.log('📝 Extracted text length:', data.text.length, 'characters');
        console.log('\n📄 First 500 characters:');
        console.log(data.text.substring(0, 500));
        console.log('\n...\n');
        console.log('📄 Last 200 characters:');
        console.log(data.text.substring(Math.max(0, data.text.length - 200)));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPDF();
