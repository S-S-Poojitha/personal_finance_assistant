import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { apiService } from './services/apiService';
import Header from './components/Layout/Header';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionList from './components/Transactions/TransactionList';
import AddTransaction from './components/Transactions/AddTransaction';
import UploadReceipt from './components/Upload/UploadReceipt';
import Analytics from './components/Analytics/Analytics';
import AlertMessage from './components/UI/AlertMessage';

function MainApp() {
  const { user, token, logout } = useAuth();
  const [currentView, setCurrentView] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    try {
      const data = await apiService.get('/transactions');
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (token) {
      setCurrentView('dashboard');
      fetchTransactions();
    } else {
      setCurrentView('login');
    }
  }, [token]);

  const handleLoginSuccess = () => {
    setSuccess('Login successful!');
    setCurrentView('dashboard');
  };

  const handleRegisterSuccess = () => {
    setSuccess('Registration successful! Please login.');
    setCurrentView('login');
  };

  const handleLogout = () => {
    logout();
    setCurrentView('login');
    setTransactions([]);
  };

  const handleTransactionAdded = () => {
    fetchTransactions(); // Refresh transactions when new ones are added
    setSuccess('Transaction added successfully!');
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <AlertMessage error={error} success={success} onClear={clearMessages} />
          
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
            <LoginForm 
              onSuccess={handleLoginSuccess} 
              onError={setError}
            />
          ) : (
            <RegisterForm 
              onSuccess={handleRegisterSuccess} 
              onError={setError}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AlertMessage error={error} success={success} onClear={clearMessages} />
        
        {currentView === 'dashboard' && (
          <Dashboard transactions={transactions} />
        )}
        
        {currentView === 'analytics' && (
          <Analytics transactions={transactions} />
        )}
        
        {currentView === 'transactions' && (
          <TransactionList />
        )}
        
        {currentView === 'add-transaction' && (
          <AddTransaction onTransactionAdded={handleTransactionAdded} />
        )}
        
        {currentView === 'upload' && (
          <UploadReceipt onTransactionAdded={handleTransactionAdded} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
