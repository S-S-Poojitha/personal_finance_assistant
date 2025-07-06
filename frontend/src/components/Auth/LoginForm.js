import React, { useState } from 'react';
import { DollarSign, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';

const LoginForm = ({ onSuccess, onError }) => {
    const { login, setLoading, loading } = useAuth();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const data = await apiService.login(formData);
            login(data.token);
            if (onSuccess) onSuccess('Login successful!');
        } catch (err) {
            if (onError) onError(err.message);
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
        <div className="text-center mb-8">
            <DollarSign className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Finance Assistant</h1>
            <p className="text-gray-600 mt-2">Track your finances effortlessly</p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
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
        </div>
    );
};

export default LoginForm;
