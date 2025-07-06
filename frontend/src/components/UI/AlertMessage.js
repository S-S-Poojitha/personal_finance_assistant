import React, { useEffect } from 'react';

const AlertMessage = ({ error, success, onClear }) => {
    // Auto-dismiss success messages after 5 seconds
    useEffect(() => {
        if (success && onClear) {
            const timer = setTimeout(() => {
                onClear();
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [success, onClear]);

    if (!error && !success) return null;

    const message = error || success;
    const type = error ? 'error' : 'success';
    const bgColor = type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700';
    
    return (
        <div className={`${bgColor} border px-4 py-3 rounded-lg mb-4 relative animate-in slide-in-from-top-2 duration-300`}>
            <div className="flex items-center">
                <span className="mr-2">
                    {type === 'error' ? '❌' : '✅'}
                </span>
                {message}
            </div>
            {onClear && (
                <button
                    onClick={onClear}
                    className="absolute top-0 bottom-0 right-0 px-4 py-3 hover:bg-gray-100 rounded-r-lg transition-colors"
                >
                    <span className="sr-only">Dismiss</span>
                    ×
                </button>
            )}
        </div>
    );
};

export default AlertMessage;
