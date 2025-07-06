// Simple diagnostic script to check user authentication and API endpoints
// Run this in the browser console

console.log('🔍 DIAGNOSTIC REPORT - Personal Finance App');
console.log('==========================================');

// Check localStorage
const token = localStorage.getItem('token');
console.log('🔑 Token exists:', !!token);
if (token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🆔 User ID from token:', payload.userId);
        console.log('🕐 Token expires:', new Date(payload.exp * 1000));
    } catch (e) {
        console.log('❌ Invalid token format');
    }
}

// Check current user from API
if (token) {
    fetch('http://localhost:8000/api/transactions?limit=5', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log('📊 Sample transactions from API:', data);
        if (Array.isArray(data) && data.length > 0) {
            console.log('🆔 User ID in transactions:', data[0].userId);
            console.log('📅 Date range:', {
                oldest: data[data.length - 1]?.date,
                newest: data[0]?.date
            });
        }
    })
    .catch(err => console.log('❌ API Error:', err));
}

// Check localStorage for any cached data
Object.keys(localStorage).forEach(key => {
    if (key.includes('transaction') || key.includes('finance')) {
        console.log(`💾 LocalStorage[${key}]:`, localStorage.getItem(key));
    }
});

console.log('==========================================');
