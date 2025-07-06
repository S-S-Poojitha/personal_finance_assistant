# Image OCR Upload Feature

## Overview
Added image OCR functionality to the Personal Finance Assistant to process receipt/bill images and automatically extract transactions.

## New Endpoint
**POST** `/api/upload/image`

### Request
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Authentication**: Bearer token required
- **Field Name**: `file`

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- Maximum file size: 5MB

### Process Flow
1. **Image Upload**: User uploads receipt/bill image
2. **OCR Processing**: Gemini Vision API extracts text from image
3. **AI Parsing**: Extracted text is analyzed to identify transactions
4. **Database Storage**: Valid transactions are saved to database
5. **Response**: Returns success message with transaction count

### Response Examples

#### Success (with transactions found)
```json
{
  "message": "Successfully processed receipt image! Added 2 transaction(s) with AI categorization.",
  "transactionsAdded": 2,
  "extractedText": "GROCERY STORE\nDate: 2025-07-07\nBread - ₹40\nMilk - ₹60\nTotal: ₹100"
}
```

#### Success (no transactions found)
```json
{
  "message": "Image processed but no valid transactions were detected.",
  "extractedText": "Some extracted text that didn't contain transaction data"
}
```

#### Error Response
```json
{
  "message": "Failed to process image",
  "error": "Specific error details"
}
```

## Technical Implementation

### Files Modified
1. **uploadController.js**: Added `uploadImage` method and `imageUpload` multer config
2. **upload.js** (routes): Added `/image` route
3. **aiService.js**: Added `processImageWithGemini` function
4. **app.js**: Updated endpoint logging

### Key Features
- **Separate multer config** for images vs PDFs
- **Comprehensive error handling** with file cleanup
- **Debug logging** for troubleshooting
- **Automatic categorization** using existing AI service
- **Transaction validation** before database save

### Error Handling
- Invalid file types rejected
- File size limits enforced
- API failures caught and reported
- Temporary files cleaned up automatically
- Database save failures handled gracefully

## Usage in Frontend
```javascript
const uploadImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    const result = await response.json();
    return result;
};
```

## Dependencies
- **Gemini Vision API**: For OCR text extraction
- **Multer**: For file upload handling
- **Existing AI Service**: For transaction parsing and categorization
