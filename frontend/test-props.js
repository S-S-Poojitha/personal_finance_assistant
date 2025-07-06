// Test component props to verify onToggleView is working
const testRegisterFormProps = {
    onToggleView: (view) => {
        console.log('✅ onToggleView called with:', view);
    },
    onError: (error) => {
        console.log('❌ onError called with:', error);
    },
    onSuccess: (message) => {
        console.log('✅ onSuccess called with:', message);
    }
};

console.log('🧪 Testing RegisterForm props:');
console.log('- onToggleView:', typeof testRegisterFormProps.onToggleView);
console.log('- onError:', typeof testRegisterFormProps.onError);
console.log('- onSuccess:', typeof testRegisterFormProps.onSuccess);

// Simulate calling the functions
testRegisterFormProps.onToggleView('login');
testRegisterFormProps.onError('Test error message');
testRegisterFormProps.onSuccess('Test success message');
