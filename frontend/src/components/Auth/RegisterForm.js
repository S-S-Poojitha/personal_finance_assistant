import React, { useState } from 'react';
import { DollarSign, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';

const RegisterForm = ({ onToggleView, onError, onSuccess }) => {
    const { setLoading, loading } = useAuth();
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError('');
        setLocalSuccess('');
        
        try {
            console.log('🔔 Frontend: Attempting registration with:', { 
                username: formData.username, 
                email: formData.email, 
                passwordLength: formData.password.length 
            });
            
            await apiService.register(formData);
            setLocalSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => {
                onSuccess('Registration successful! Please login.');
                if (onToggleView) {
                    onToggleView('login');
                }
            }, 1500);
        } catch (err) {
            console.error('❌ Frontend: Registration failed:', err.message);
            setLocalError(err.message);
            onError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <DollarSign className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">Finance Assistant</h1>
                    <p className="text-gray-600 mt-2">Track your finances effortlessly</p>
                </div>

                <div className="flex mb-6">
                    <button
                        onClick={() => onToggleView && onToggleView('login')}
                        className="flex-1 py-2 px-4 rounded-l-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => onToggleView && onToggleView('register')}
                        className="flex-1 py-2 px-4 rounded-r-lg font-medium bg-indigo-600 text-white"
                    >
                        Register
                    </button>
                </div>

                {/* Local Error Display */}
                {localError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                            <p className="text-sm text-red-700 font-medium">Registration Failed</p>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{localError}</p>
                    </div>
                )}

                {/* Local Success Display */}
                {localSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <p className="text-sm text-green-700 font-medium">Success!</p>
                        </div>
                        <p className="text-sm text-green-600 mt-1">{localSuccess}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            minLength="3"
                        />
                        <p className="text-xs text-gray-500 mt-1">At least 3 characters, must be unique</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Valid email address, must be unique</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                                required
                                minLength="6"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !formData.username || !formData.email || !formData.password}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Registering...
                            </div>
                        ) : 'Register'}
                    </button>
                </form>

                {/* Debug Information (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium mb-2">Debug Info:</p>
                        <p className="text-xs text-gray-500">API Base: {process.env.REACT_APP_API_BASE || 'http://localhost:8000/api'}</p>
                        <p className="text-xs text-gray-500">Form Valid: {formData.username && formData.email && formData.password ? 'Yes' : 'No'}</p>
                        <p className="text-xs text-gray-500">Loading: {loading ? 'Yes' : 'No'}</p>
                        {localError && <p className="text-xs text-red-500">Last Error: {localError}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterForm;
