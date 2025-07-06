import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { formatCurrency, formatDate, predefinedCategories } from '../../utils/helpers';
import AlertMessage from '../UI/AlertMessage';

const Analytics = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expenseCategoryData, setExpenseCategoryData] = useState([]);
  const [incomeCategoryData, setIncomeCategoryData] = useState([]);
  const [dateData, setDateData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch transactions and summary data
      const [allTransactionsRes, categoryResponse, dateResponse] = await Promise.all([
        apiService.getTransactions({ limit: 1000 }), // Get all transactions
        apiService.get('/summary/by-category'),
        apiService.get('/summary/by-date')
      ]);

      const allTransactions = Array.isArray(allTransactionsRes) ? allTransactionsRes : allTransactionsRes.transactions || [];
      setTransactions(allTransactions);
      
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
      
      setExpenseCategoryData(expenseCategories);
      setIncomeCategoryData(incomeCategories);
      
      // Process date data and fill missing dates
      const dateMap = {};
      dateResponse.forEach(item => {
        dateMap[item._id] = item.total;
      });
      
      // Get date range from transactions or last 30 days
      let minDate, maxDate;
      if (allTransactions.length > 0) {
        const dates = allTransactions.map(t => new Date(t.date));
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
      allTransactions.forEach(transaction => {
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
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchChartData();
    }
  }, [token, fetchChartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertMessage error={error} />
      
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
                      const utcDay = date.getUTCDate();
                      const utcMonth = date.getUTCMonth();
                      const utcYear = date.getUTCFullYear();
                      return new Date(utcYear, utcMonth, utcDay).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Amount']}
                    labelFormatter={(label) => formatDate(label)}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💸 Expense Categories Chart</h3>
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

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Income Categories Chart</h3>
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
  );
};

export default Analytics;
