import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Upload, DollarSign, TrendingUp, TrendingDown, Eye, EyeOff, LogOut } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const PersonalFinanceApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [filterForm, setFilterForm] = useState({ start: '', end: '', page: 1, limit: 10 });
  const [categoryData, setCategoryData] = useState([]);
  const [dateData, setDateData] = useState([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState([]);
  const [incomeCategoryData, setIncomeCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

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

  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  };

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      // Fix date formatting for proper filtering
      if (filterForm.start) {
        const startDate = new Date(filterForm.start);
        startDate.setHours(0, 0, 0, 0); // Start of day
        params.append('start', startDate.toISOString());
      }
      
      if (filterForm.end) {
        const endDate = new Date(filterForm.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        params.append('end', endDate.toISOString());
      }
      
      params.append('page', filterForm.page);
      params.append('limit', filterForm.limit);
      
      console.log('🔍 Fetching transactions with filters:', {
        start: filterForm.start,
        end: filterForm.end,
        page: filterForm.page,
        limit: filterForm.limit
      });
      
      const data = await apiCall(`/transactions?${params}`);
      setTransactions(data);
      
      console.log('📊 Received transactions:', data.length);
    } catch (err) {
      setError(err.message);
    }
  }, [filterForm.start, filterForm.end, filterForm.page, filterForm.limit, token]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiCall('/categories');
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const fetchChartData = useCallback(async () => {
    try {
      const [categoryResponse, dateResponse] = await Promise.all([
        apiCall('/summary/by-category'),
        apiCall('/summary/by-date')
      ]);
      
      // Process category data - separate income and expense categories
      const expenseCategories = [];
      const incomeCategories = [];
      
      categoryResponse.forEach(item => {
        // Check if this category belongs to expenses or income
        if (predefinedCategories.expense.includes(item._id)) {
          expenseCategories.push({
            name: item._id,
            value: item.total
          });
        } else if (predefinedCategories.income.includes(item._id)) {
          incomeCategories.push({
            name: item._id,
            value: item.total
          });
        }
      });
      
      setCategoryData(categoryResponse.map(item => ({
        name: item._id,
        value: item.total
      })));
      setExpenseCategoryData(expenseCategories);
      setIncomeCategoryData(incomeCategories);
      
      // Process date data and fill missing dates
      const dateMap = {};
      dateResponse.forEach(item => {
        dateMap[item._id] = item.total;
      });
      
      // Get date range from transactions or last 30 days
      let minDate, maxDate;
      if (transactions.length > 0) {
        const dates = transactions.map(t => new Date(t.date));
        minDate = new Date(Math.min(...dates));
        maxDate = new Date(Math.max(...dates));
      } else {
        maxDate = new Date();
        minDate = new Date();
        minDate.setDate(minDate.getDate() - 30);
      }
      
      const filledDateData = [];
      const currentDate = new Date(minDate);
      
      while (currentDate <= maxDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        filledDateData.push({
          date: dateStr,
          amount: dateMap[dateStr] || 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setDateData(filledDateData);
      
      // Calculate monthly data
      const monthlyMap = {};
      transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: monthKey,
            income: 0,
            expense: 0,
            net: 0
          };
        }
        
        if (transaction.type === 'income') {
          monthlyMap[monthKey].income += transaction.amount;
        } else {
          monthlyMap[monthKey].expense += transaction.amount;
        }
        monthlyMap[monthKey].net = monthlyMap[monthKey].income - monthlyMap[monthKey].expense;
      });
      
      const monthlyArray = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
      setMonthlyData(monthlyArray);
      
    } catch (err) {
      setError(err.message);
    }
  }, [token, transactions]);

  useEffect(() => {
    if (token) {
      setCurrentView('dashboard');
      fetchTransactions();
      fetchCategories();
      fetchChartData();
    }
  }, [token]);

  // Separate effect to refetch transactions when filters change
  useEffect(() => {
    if (token && currentView === 'transactions') {
      fetchTransactions();
    }
  }, [filterForm.start, filterForm.end, filterForm.page, filterForm.limit, token, currentView]);

  // Separate effect to refetch chart data when viewing dashboard or analytics
  useEffect(() => {
    if (token && (currentView === 'dashboard' || currentView === 'analytics') && transactions.length > 0) {
      fetchChartData();
    }
  }, [token, currentView, transactions, fetchChartData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });
      
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setCurrentView('dashboard');
      setSuccess('Login successful!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify(registerForm)
      });
      
      setSuccess('Registration successful! Please login.');
      setCurrentView('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setCurrentView('login');
    setTransactions([]);
    setCategories([]);
    setCategoryData([]);
    setDateData([]);
    setExpenseCategoryData([]);
    setIncomeCategoryData([]);
    setMonthlyData([]);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          ...transactionForm,
          amount: parseFloat(transactionForm.amount)
        })
      });
      
      setSuccess('Transaction added successfully!');
      setTransactionForm({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      fetchTransactions();
      fetchChartData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const parseReceiptWithGemini = async (receiptText) => {
    try {
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
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        try {
          const jsonMatch = geminiText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const transactions = JSON.parse(jsonMatch[0]);
            
            return transactions.filter(tx => 
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
          }
        } catch (parseError) {
          console.error('Failed to parse Gemini response:', parseError);
        }
      }
    } catch (error) {
      console.error('Gemini API error:', error);
    }
    
    return parseReceiptSimple(receiptText);
  };

  const parseReceiptSimple = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const transactions = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      const amountMatch = line.match(/(?:₹|rs\.?|\$)?\s*(\d+\.?\d*)/);
      
      if (amountMatch && !line.includes('total') && !line.includes('subtotal') && !line.includes('gst') && !line.includes('tax')) {
        const amount = parseFloat(amountMatch[1]);
        
        if (amount > 0 && amount < 10000) {
          let description = lines[i].replace(/(?:₹|rs\.?|\$)?\s*\d+\.?\d*/gi, '').trim();
          
          if (!description || description.length < 3) {
            description = i > 0 ? lines[i-1] : `Item ${transactions.length + 1}`;
          }
          
          const result = smartCategorize(description, 'expense');
          
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
    
    return transactions;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE}/upload/pdf`, {
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
      
      const extractedTransactions = await parseReceiptWithGemini(data.text);
      
      if (extractedTransactions.length > 0) {
        let successCount = 0;
        
        for (const transaction of extractedTransactions) {
          try {
            await apiCall('/transactions', {
              method: 'POST',
              body: JSON.stringify(transaction)
            });
            successCount++;
          } catch (err) {
            console.error('Failed to add transaction:', err);
          }
        }
        
        if (successCount > 0) {
          setSuccess(`Successfully processed receipt! Added ${successCount} transaction(s) with AI categorization.`);
          fetchTransactions();
          fetchChartData();
        } else {
          setError('Failed to add transactions to database');
        }
      } else {
        setSuccess('Receipt processed but no valid transactions were detected.');
      }
      
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (currentView === 'login' || currentView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <DollarSign className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Finance Assistant</h1>
            <p className="text-gray-600 mt-2">Track your finances effortlessly</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <div className="flex mb-6">
            <button
              onClick={() => setCurrentView('login')}
              className={`flex-1 py-2 px-4 rounded-l-lg font-medium ${
                currentView === 'login' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setCurrentView('register')}
              className={`flex-1 py-2 px-4 rounded-r-lg font-medium ${
                currentView === 'register' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Register
            </button>
          </div>

          {currentView === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-indigo-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Personal Finance Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-6">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'dashboard' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'analytics' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setCurrentView('transactions')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'transactions' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setCurrentView('add-transaction')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'add-transaction' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Add Transaction
                </button>
                <button
                  onClick={() => setCurrentView('upload')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'upload' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upload Receipt
                </button>
              </nav>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Total Income</h3>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Total Expenses</h3>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Net Balance</h3>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💸 Expenses by Category</h3>
                {expenseCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <p>No expense data available</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Income by Category</h3>
                {incomeCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incomeCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#82ca9d"
                        dataKey="value"
                      >
                        {incomeCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#82ca9d', '#8dd1e1', '#ffc658', '#ff7c7c', '#d084d0', '#8884d8'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <p>No income data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Daily Expenses Trend</h3>
                {dateData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Amount']}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString('en-IN');
                        }}
                      />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <p>No daily expense data available</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Monthly Income vs Expenses</h3>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const [year, month] = value.split('-');
                          return `${month}/${year.slice(2)}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)]}
                        labelFormatter={(label) => {
                          const [year, month] = label.split('-');
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return `${monthNames[parseInt(month) - 1]} ${year}`;
                        }}
                      />
                      <Bar dataKey="income" fill="#82ca9d" name="income" />
                      <Bar dataKey="expense" fill="#ff7c7c" name="expense" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <p>No monthly data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.slice(0, 5).map((transaction, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'add-transaction' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Transaction</h2>
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
        )}

        {currentView === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Detailed Analytics</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💸 Top Expense Categories</h3>
                  {expenseCategoryData.length > 0 ? (
                    <div className="space-y-3">
                      {expenseCategoryData
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5)
                        .map((category, index) => (
                          <div key={category.name} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{category.name}</span>
                            <span className="text-sm font-bold text-red-600">{formatCurrency(category.value)}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No expense categories found</p>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Top Income Sources</h3>
                  {incomeCategoryData.length > 0 ? (
                    <div className="space-y-3">
                      {incomeCategoryData
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5)
                        .map((category, index) => (
                          <div key={category.name} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{category.name}</span>
                            <span className="text-sm font-bold text-green-600">{formatCurrency(category.value)}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No income categories found</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Last 7 Days Expenses</h3>
                  {dateData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dateData.slice(-7)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), 'Amount']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN')}
                        />
                        <Bar dataKey="amount" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-gray-500">
                      <p>No recent expense data</p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Spending Pattern</h3>
                  {transactions.length > 0 ? (
                    <div className="space-y-4">
                      {(() => {
                        const dailyAvg = transactions
                          .filter(t => t.type === 'expense')
                          .reduce((sum, t) => sum + t.amount, 0) / 
                          Math.max(1, new Set(transactions.map(t => t.date)).size);
                        
                        const weeklyAvg = dailyAvg * 7;
                        const monthlyAvg = dailyAvg * 30;
                        
                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Daily Average:</span>
                              <span className="text-sm font-semibold">{formatCurrency(dailyAvg)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Weekly Average:</span>
                              <span className="text-sm font-semibold">{formatCurrency(weeklyAvg)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Monthly Average:</span>
                              <span className="text-sm font-semibold">{formatCurrency(monthlyAvg)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-gray-500">No spending data available</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Monthly Trends (Income vs Expenses)</h3>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const [year, month] = value.split('-');
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`;
                          }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value, name) => [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)]}
                          labelFormatter={(label) => {
                            const [year, month] = label.split('-');
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return `${monthNames[parseInt(month) - 1]} ${year}`;
                          }}
                        />
                        <Bar dataKey="income" fill="#10B981" name="income" />
                        <Bar dataKey="expense" fill="#EF4444" name="expense" />
                        <Bar dataKey="net" fill="#6366F1" name="net" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                      <p>No monthly trend data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Filter Transactions</h2>
              
              {/* Debug info */}
              {(filterForm.start || filterForm.end) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    🔍 <strong>Active Filters:</strong>
                    {filterForm.start && (
                      <span> From: <strong>{new Date(filterForm.start).toLocaleDateString('en-IN')}</strong></span>
                    )}
                    {filterForm.end && (
                      <span> To: <strong>{new Date(filterForm.end).toLocaleDateString('en-IN')}</strong></span>
                    )}
                    <span> | Found: <strong>{transactions.length}</strong> transactions</span>
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filterForm.start}
                    onChange={(e) => setFilterForm({...filterForm, start: e.target.value, page: 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filterForm.end}
                    onChange={(e) => setFilterForm({...filterForm, end: e.target.value, page: 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
                  <input
                    type="number"
                    min="1"
                    value={filterForm.page}
                    onChange={(e) => setFilterForm({...filterForm, page: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
                  <select
                    value={filterForm.limit}
                    onChange={(e) => setFilterForm({...filterForm, limit: parseInt(e.target.value), page: 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => {
                    setFilterForm({ start: '', end: '', page: 1, limit: 10 });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Clear Filters
                </button>
                <button
                  onClick={fetchTransactions}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? '💰 Income' : '💸 Expense'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={transaction.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {filterForm.page} with {filterForm.limit} items per page
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setFilterForm(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
                    }}
                    disabled={filterForm.page <= 1}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      setFilterForm(prev => ({ ...prev, page: prev.page + 1 }));
                    }}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'upload' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🧾 Upload Receipt for AI Processing</h2>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center bg-indigo-50">
                <Upload className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-indigo-900 mb-2">Upload PDF Receipt</h3>
                <p className="text-indigo-700 mb-6">
                  Select a PDF receipt and let our AI extract transactions automatically
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer cursor-pointer disabled:opacity-50"
                />
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-3 text-lg">🤖 AI-Powered Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="text-sm text-green-800 space-y-2">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                      Smart text extraction from PDF receipts
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
                      Indian currency format support
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
        )}
      </main>
    </div>
  );
};

export default PersonalFinanceApp;
