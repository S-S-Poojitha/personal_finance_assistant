// Quick test to check registration endpoint
const testRegistration = async () => {
    const API_BASE = 'http://localhost:8000/api';
    
    // Test data - using timestamp to avoid duplicates
    const testUser = {
        username: 'testuser_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password: 'testpass123'
    };

    console.log('🧪 Testing registration with:', testUser.username);

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Registration successful:', data);
        } else {
            console.error('❌ Registration failed:', response.status, data);
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
};

// Run the test
testRegistration();
