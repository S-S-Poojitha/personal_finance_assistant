import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import AlertMessage from '../UI/AlertMessage';

const TransactionList = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterForm, setFilterForm] = useState({ 
    start: '', 
    end: '', 
    page: 1, 
    limit: 10 
  });

  const fetchTransactions = useCallback(async () => {
    if (!token) {
      console.log('❌ No token available, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Build filters object
      const filters = {
        page: filterForm.page,
        limit: filterForm.limit
      };
      
      // Add date filters if they exist
      if (filterForm.start) {
        const startDate = new Date(filterForm.start);
        startDate.setHours(0, 0, 0, 0); // Start of day
        filters.start = startDate.toISOString();
      }
      
      if (filterForm.end) {
        const endDate = new Date(filterForm.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        filters.end = endDate.toISOString();
      }
      
      console.log('🔍 Fetching transactions with filters:', filters);
      console.log('🔍 Token available:', !!token);
      
      const data = await apiService.getTransactions(filters);
      console.log('🔄 API Response received:', data);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setTransactions(data);
        console.log('📊 Received transactions:', data.length);
      } else {
        console.error('❌ API returned non-array data:', data);
        setTransactions([]);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('❌ Transaction fetch error:', err);
      setError(err.message || 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, filterForm.start, filterForm.end, filterForm.page, filterForm.limit]);

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token, fetchTransactions]); // Include fetchTransactions so it runs when filters change

  const clearFilters = () => {
    setFilterForm({ start: '', end: '', page: 1, limit: 10 });
    // fetchTransactions will be called automatically due to useEffect dependency
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Filter Transactions</h2>
        
        {/* Debug info */}
        {(filterForm.start || filterForm.end) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              🔍 <strong>Active Filters:</strong>
              {filterForm.start && (
                <span> From: <strong>{formatDate(filterForm.start)}</strong></span>
              )}
              {filterForm.end && (
                <span> To: <strong>{formatDate(filterForm.end)}</strong></span>
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
            onClick={clearFilters}
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

      <AlertMessage error={error} />

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
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
                  {Array.isArray(transactions) && transactions.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.date)}
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
                  {(!transactions || transactions.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <p className="text-lg">📋 No transactions found</p>
                          <p className="text-sm mt-2">Try adjusting your filters or add some transactions.</p>
                        </div>
                      </td>
                    </tr>
                  )}
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
                    const newPage = Math.max(1, filterForm.page - 1);
                    setFilterForm(prev => ({ ...prev, page: newPage }));
                  }}
                  disabled={filterForm.page <= 1}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {filterForm.page}
                </span>
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
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
