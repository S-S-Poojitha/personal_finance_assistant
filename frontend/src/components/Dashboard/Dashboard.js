import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiService from '../../services/apiService';
import { formatCurrency, formatDate, predefinedCategories } from '../../utils/helpers';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

const Dashboard = ({ onError }) => {
    const [transactions, setTransactions] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [expenseCategoryData, setExpenseCategoryData] = useState([]);
    const [incomeCategoryData, setIncomeCategoryData] = useState([]);
    const [dateData, setDateData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch ALL transactions and category summaries
            const [allTransactionsRes, expenseCategoryRes, incomeCategoryRes, dateRes] = await Promise.all([
                apiService.getTransactions({ limit: 1000 }), // Get many transactions for totals
                apiService.getCategorySummary(), // Expense categories
                apiService.getIncomeCategorySummary(), // Income categories
                apiService.getDateSummary()
            ]);

            const allTransactions = Array.isArray(allTransactionsRes) ? allTransactionsRes : allTransactionsRes.transactions || [];
            
            // Set all transactions for calculations
            setTransactions(allTransactions);
            
            // Process expense category data
            const expenseCategories = expenseCategoryRes.map(item => ({
                name: item._id,
                value: item.total
            }));
            
            // Process income category data
            const incomeCategories = incomeCategoryRes.map(item => ({
                name: item._id,
                value: item.total
            }));
            
            setCategoryData(expenseCategoryRes.map(item => ({
                name: item._id,
                value: item.total
            })));
            setExpenseCategoryData(expenseCategories);
            setIncomeCategoryData(incomeCategories);
            
            // Process date data for daily expenses trend
            // Use actual transaction data instead of just backend summary to ensure accuracy
            const dailyExpenseMap = {};
            
            // Process all expense transactions to build daily totals
            const expenseTransactionsForChart = allTransactions
                .filter(t => {
                    // Handle case-insensitive and whitespace-tolerant type checking
                    const normalizedType = (t.type || '').toString().trim().toLowerCase();
                    return normalizedType === 'expense';
                });
            
            expenseTransactionsForChart.forEach(transaction => {
                // Handle both ISO format and various date formats
                let dateStr;
                try {
                    const transactionDate = new Date(transaction.date);
                    // Ensure we're working with a valid date
                    if (isNaN(transactionDate.getTime())) {
                        return;
                    }
                    dateStr = transactionDate.toISOString().split('T')[0];
                } catch (error) {
                    return;
                }
                
                if (!dailyExpenseMap[dateStr]) {
                    dailyExpenseMap[dateStr] = 0;
                }
                dailyExpenseMap[dateStr] += transaction.amount;
            });
            
            // Also merge with backend date summary for consistency
            dateRes.forEach(item => {
                if (!dailyExpenseMap[item._id]) {
                    dailyExpenseMap[item._id] = item.total;
                }
            });
            
            // Get date range - show a reasonable range that includes all data
            let minDate, maxDate;
            const today = new Date();
            
            if (allTransactions.length > 0) {
                const dates = allTransactions.map(t => new Date(t.date));
                const dataMinDate = new Date(Math.min(...dates));
                const dataMaxDate = new Date(Math.max(...dates));
                
                // Calculate the span of our data
                const dataSpanDays = Math.ceil((dataMaxDate - dataMinDate) / (1000 * 60 * 60 * 24));
                
                // If data spans less than 30 days, show at least 30 days for context
                // If data spans more, show the full range
                if (dataSpanDays <= 30) {
                    // For short data ranges, extend to show 30 days from the earliest or latest date
                    const thirtyDaysAgo = new Date(dataMaxDate);
                    thirtyDaysAgo.setDate(dataMaxDate.getDate() - 29); // 30 days total including today
                    
                    minDate = dataMinDate < thirtyDaysAgo ? dataMinDate : thirtyDaysAgo;
                    maxDate = dataMaxDate > today ? dataMaxDate : today;
                } else {
                    // For longer data ranges, show all data plus a few days buffer
                    minDate = new Date(dataMinDate);
                    minDate.setDate(dataMinDate.getDate() - 2); // 2-day buffer before
                    
                    maxDate = new Date(dataMaxDate);
                    maxDate.setDate(dataMaxDate.getDate() + 2); // 2-day buffer after
                    
                    // But don't go beyond today
                    if (maxDate > today) {
                        maxDate = today;
                    }
                }
            } else {
                // No data - show last 30 days
                maxDate = today;
                minDate = new Date();
                minDate.setDate(today.getDate() - 29);
            }
            
            const filledDateData = [];
            const currentDate = new Date(minDate);
            
            while (currentDate <= maxDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const amount = dailyExpenseMap[dateStr] || 0;
                
                // Use UTC date parts to avoid timezone issues
                const utcDay = currentDate.getUTCDate();
                const utcMonth = currentDate.getUTCMonth();
                const utcYear = currentDate.getUTCFullYear();
                const formattedDate = new Date(utcYear, utcMonth, utcDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                filledDateData.push({
                    date: dateStr,
                    amount: amount,
                    formattedDate: formattedDate
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            setDateData(filledDateData);
            
            // Calculate monthly data for income vs expense comparison
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
            if (onError && typeof onError === 'function') {
                onError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [onError]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const totalIncome = transactions.filter(t => (t.type || '').toString().trim().toLowerCase() === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => (t.type || '').toString().trim().toLowerCase() === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
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

            {/* Enhanced Charts Section */}
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
                        <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                            <p className="text-center">
                                {transactions.filter(t => t.type === 'expense').length === 0 
                                    ? "💸 No expense transactions recorded yet."
                                    : "📊 No expense category data available."
                                }
                            </p>
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
                        <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                            <p className="text-center">
                                {transactions.filter(t => t.type === 'income').length === 0 
                                    ? "💰 No income transactions recorded yet."
                                    : "📊 No income category data available."
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        📅 Daily Expenses Trend 
                        <span className="text-sm text-gray-500 ml-2">
                            ({dateData.filter(d => d.amount > 0).length} of {dateData.length} days with expenses)
                        </span>
                    </h3>
                    {dateData.length > 0 ? (
                        dateData.some(d => d.amount > 0) ? (
                            <>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={dateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fontSize: 11 }}
                                            interval="preserveStartEnd"
                                            tickFormatter={(value) => {
                                                const date = new Date(value + 'T00:00:00Z');
                                                const utcDay = date.getUTCDate();
                                                const utcMonth = date.getUTCMonth() + 1;
                                                return `${utcDay}/${utcMonth}`;
                                            }}
                                        />
                                        <YAxis 
                                            tick={{ fontSize: 11 }}
                                            tickFormatter={(value) => `₹${value > 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                                        />
                                        <Tooltip 
                                            formatter={(value) => [
                                                value > 0 ? formatCurrency(value) : 'No expenses',
                                                'Daily Expense'
                                            ]}
                                            labelFormatter={(label) => {
                                                return formatDate(label + 'T00:00:00Z'); // Add time to ensure proper parsing
                                            }}
                                            contentStyle={{
                                                backgroundColor: '#f8f9fa',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <Bar 
                                            dataKey="amount" 
                                            fill="#8884d8" 
                                            radius={[2, 2, 0, 0]}
                                            name="Daily Expense"
                                            minPointSize={1}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="mt-2 text-center">
                                    <p className="text-xs text-gray-500">
                                        💡 Hover over any bar to see details. Empty areas indicate days with no expenses.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                                <p className="text-center">
                                    {transactions.length > 0 
                                        ? transactions.filter(t => t.type === 'expense').length === 0
                                            ? "📊 You have transactions but no expenses recorded yet."
                                            : "📅 No expenses found in the selected date range."
                                        : "📈 No transactions recorded yet. Add some expenses to see the trend."
                                    }
                                </p>
                                {transactions.length > 0 && transactions.filter(t => t.type === 'expense').length === 0 && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        You have {transactions.filter(t => t.type === 'income').length} income transaction(s).
                                    </p>
                                )}
                                {transactions.filter(t => t.type === 'expense').length > 0 && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        Found {transactions.filter(t => t.type === 'expense').length} expense(s) but none in the current date range.
                                    </p>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                            <p className="text-center">📊 Loading expense data...</p>
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
                        <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                            <p className="text-center">
                                {transactions.length === 0 
                                    ? "📈 No transactions recorded yet. Add some transactions to see monthly trends."
                                    : "📊 No monthly data available for the selected period."
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
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
            </div>
        </div>
    );
};

export default Dashboard;
