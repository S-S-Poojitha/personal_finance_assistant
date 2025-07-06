export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('token');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            console.log('🌐 Request:', config.method || 'GET', url);
            const response = await fetch(url, config);
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('❌ Failed to parse response as JSON:', parseError);
                throw new Error(`Server response could not be parsed. Status: ${response.status}`);
            }

            console.log('📡 Response:', response.status, response.statusText);

            if (!response.ok) {
                const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
                console.error('❌ API Error:', response.status, errorMessage);
                throw new Error(errorMessage);
            }

            console.log('✅ Request successful');
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Generic HTTP methods
    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Authentication
    async register(userData) {
        console.log('🔔 ApiService: Registering user:', userData.username);
        console.log('🌐 ApiService: Request URL:', `${this.baseURL}/auth/register`);
        
        try {
            const result = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            console.log('✅ ApiService: Registration successful');
            return result;
        } catch (error) {
            console.error('❌ ApiService: Registration failed:', error.message);
            throw error;
        }
    }

    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    // Transactions
    async getTransactions(filters = {}) {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        const queryString = params.toString();
        return this.request(`/transactions${queryString ? `?${queryString}` : ''}`);
    }

    async addTransaction(transaction) {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction)
        });
    }

    async getCategories() {
        return this.request('/transactions/categories');
    }

    async autoCategorize(description) {
        return this.request('/transactions/autocategorize', {
            method: 'POST',
            body: JSON.stringify({ description })
        });
    }

    // Analytics
    async getCategorySummary() {
        return this.request('/transactions/summary/by-category');
    }

    async getIncomeCategorySummary() {
        return this.request('/transactions/summary/income-by-category');
    }

    async getDateSummary() {
        return this.request('/transactions/summary/by-date');
    }

    // File upload
    async uploadPDF(file) {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const response = await fetch(`${this.baseURL}/upload/pdf`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        return data;
    }
}

const apiService = new ApiService();
export { apiService };
export default apiService;
