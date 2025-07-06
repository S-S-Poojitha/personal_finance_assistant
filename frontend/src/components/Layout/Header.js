import React from 'react';
import { DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ currentView, setCurrentView }) => {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    const navItems = [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'transactions', label: 'Transactions' },
        { key: 'add-transaction', label: 'Add Transaction' },
        { key: 'upload', label: 'Upload Receipt' }
    ];

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-indigo-600 mr-2" />
                        <h1 className="text-xl font-bold text-gray-900">Personal Finance Assistant</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <nav className="flex space-x-6">
                            {navItems.map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setCurrentView(item.key)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        currentView === item.key 
                                            ? 'bg-indigo-100 text-indigo-700' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
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
    );
};

export default Header;
