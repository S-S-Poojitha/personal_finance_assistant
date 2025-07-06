import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService, { API_BASE } from '../../services/apiService';
import { predefinedCategories } from '../../utils/helpers';
import AlertMessage from '../UI/AlertMessage';

const UploadReceipt = ({ onTransactionAdded }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadType, setUploadType] = useState('pdf'); // 'pdf' or 'image'

  const smartCategorize = (description, transactionType = 'expense') => {
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
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Determine endpoint based on file type
      let endpoint = '/upload/pdf';
      const fileType = file.type;
      
      if (fileType.startsWith('image/')) {
        endpoint = '/upload/image';
        console.log('🖼️ Uploading image:', file.name, 'Type:', fileType);
      } else if (fileType === 'application/pdf') {
        endpoint = '/upload/pdf';
        console.log('📄 Uploading PDF:', file.name);
      } else {
        throw new Error('Unsupported file type. Please upload PDF or image files only.');
      }
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message);
      }
      
      // Backend now handles all processing and saves transactions automatically
      if (data.transactionsAdded && data.transactionsAdded > 0) {
        setSuccess(data.message);
        
        // Callback to notify parent component to refresh data
        if (onTransactionAdded) {
          onTransactionAdded();
        }
      } else {
        setSuccess(data.message || 'Receipt processed but no valid transactions were detected.');
      }
      
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🧾 Upload Receipt for AI Processing</h2>
      
      <AlertMessage error={error} success={success} />
      
      <div className="space-y-6">
        {/* Upload Type Selector */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setUploadType('pdf')}
            className={`flex-1 py-3 px-4 rounded-md font-medium text-sm transition-colors ${
              uploadType === 'pdf' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📄 PDF Receipt
          </button>
          <button
            onClick={() => setUploadType('image')}
            className={`flex-1 py-3 px-4 rounded-md font-medium text-sm transition-colors ${
              uploadType === 'image' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🖼️ Image Receipt
          </button>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center bg-indigo-50">
          <Upload className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-indigo-900 mb-2">
            {uploadType === 'pdf' ? 'Upload PDF Receipt' : 'Upload Image Receipt'}
          </h3>
          <p className="text-indigo-700 mb-6">
            {uploadType === 'pdf' 
              ? 'Select a PDF receipt and let our AI extract transactions automatically'
              : 'Take a photo or select an image of your receipt for AI processing'
            }
          </p>
          <input
            type="file"
            accept={uploadType === 'pdf' ? '.pdf' : 'image/*,.jpg,.jpeg,.png,.webp'}
            onChange={handleFileUpload}
            disabled={loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer cursor-pointer disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-2">
            {uploadType === 'pdf' 
              ? 'Supported: PDF files (max 5MB)'
              : 'Supported: JPG, PNG, WebP images (max 5MB)'
            }
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="font-semibold text-green-900 mb-3 text-lg">🤖 AI-Powered Features:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-green-800 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                Smart text extraction from PDFs & images
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                AI categorization using Gemini Pro
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                Automatic income/expense detection
              </li>
            </ul>
            <ul className="text-sm text-green-800 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                Image OCR with Vision API
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                Multiple line items per receipt
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                Automatic transaction creation
              </li>
            </ul>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3 text-lg">📱 Supported Receipt Types:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-800">
            <div>
              <strong>🍕 Food & Dining</strong>
              <p>Restaurant bills, food delivery</p>
            </div>
            <div>
              <strong>🛒 Shopping</strong>
              <p>Grocery stores, retail bills</p>
            </div>
            <div>
              <strong>⛽ Transportation</strong>
              <p>Fuel receipts, cab bills</p>
            </div>
            <div>
              <strong>🏥 Healthcare</strong>
              <p>Medical bills, pharmacy</p>
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="text-center bg-yellow-50 rounded-lg p-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <h4 className="text-lg font-medium text-yellow-900 mb-2">🤖 AI Processing Receipt...</h4>
            <p className="text-yellow-800">
              Our AI is extracting transactions and categorizing them automatically. Please wait...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadReceipt;
