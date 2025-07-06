import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { predefinedCategories } from '../../utils/helpers';
import AlertMessage from '../UI/AlertMessage';

const AddTransaction = ({ onTransactionAdded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

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

  const handleAutoCategorize = async () => {
    if (!transactionForm.description) {
      setError('Please enter a description first');
      return;
    }
    
    setLoading(true);
    
    try {
      const localResult = smartCategorize(transactionForm.description, transactionForm.type);
      
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDxG_Dn27XZ-OSeg_iWbGduohqD9gYrGiI',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `
Analyze this transaction description and categorize it for an Indian personal finance app:
"${transactionForm.description}"

Rules:
1. First determine if this is INCOME or EXPENSE
2. Then choose the most appropriate category from these predefined lists:

INCOME categories: ${predefinedCategories.income.join(', ')}
EXPENSE categories: ${predefinedCategories.expense.join(', ')}

Consider Indian context: UPI payments, Indian brands, local terms, etc.

Respond in this exact JSON format:
{
  "type": "income" or "expense",
  "category": "exact category name from the lists above"
}
                    `.trim()
                  }
                ]
              }
            ]
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        try {
          const geminiResult = JSON.parse(geminiText);
          
          if (geminiResult.type && geminiResult.category) {
            const isValidCategory = predefinedCategories[geminiResult.type]?.includes(geminiResult.category);
            
            if (isValidCategory) {
              setTransactionForm(prev => ({
                ...prev,
                type: geminiResult.type,
                category: geminiResult.category
              }));
              setSuccess(`Auto-categorized as ${geminiResult.type}: ${geminiResult.category}`);
            } else {
              setTransactionForm(prev => ({
                ...prev,
                type: localResult.type,
                category: localResult.category
              }));
              setSuccess(`Local categorization: ${localResult.type} - ${localResult.category}`);
            }
          } else {
            throw new Error('Invalid response format');
          }
        } catch (parseError) {
          setTransactionForm(prev => ({
            ...prev,
            type: localResult.type,
            category: localResult.category
          }));
          setSuccess(`Local categorization: ${localResult.type} - ${localResult.category}`);
        }
      } else {
        setTransactionForm(prev => ({
          ...prev,
          type: localResult.type,
          category: localResult.category
        }));
        setSuccess(`Local categorization: ${localResult.type} - ${localResult.category}`);
      }
      
    } catch (err) {
      const localResult = smartCategorize(transactionForm.description, transactionForm.type);
      setTransactionForm(prev => ({
        ...prev,
        type: localResult.type,
        category: localResult.category
      }));
      setSuccess(`Offline categorization: ${localResult.type} - ${localResult.category}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await apiService.post('/transactions', {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount)
      });
      
      setSuccess('Transaction added successfully!');
      setTransactionForm({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Callback to notify parent component
      if (onTransactionAdded) {
        onTransactionAdded();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Transaction</h2>
      
      <AlertMessage error={error} success={success} />
      
      <form onSubmit={handleAddTransaction} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
            <select
              value={transactionForm.type}
              onChange={(e) => setTransactionForm({...transactionForm, type: e.target.value, category: ''})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="expense">💸 Expense</option>
              <option value="income">💰 Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={transactionForm.description}
            onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter transaction description..."
            required
          />
          {transactionForm.description && (
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Click "Auto-categorize" to automatically set category and type based on description
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={transactionForm.category}
              onChange={(e) => setTransactionForm({...transactionForm, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Category</option>
              {predefinedCategories[transactionForm.type].map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAutoCategorize}
              disabled={!transactionForm.description || loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title="Use AI to automatically categorize"
            >
              {loading ? '🤖 Analyzing...' : '🤖 Auto-categorize'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={transactionForm.date}
            onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? '⏳ Adding Transaction...' : '✅ Add Transaction'}
        </button>
      </form>
    </div>
  );
};

export default AddTransaction;
