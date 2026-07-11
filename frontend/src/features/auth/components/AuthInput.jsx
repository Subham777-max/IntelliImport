import React from 'react';

const AuthInput = ({ label, id, type = 'text', value, onChange, placeholder, error }) => {
    return (
        <div className="mb-4">
            <label htmlFor={id} className="block text-xs font-semibold text-gray-800 mb-1">
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors bg-white text-black ${
                    error 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 animate-shake' 
                        : 'border-gray-300 focus:ring-black focus:border-black'
                }`}
            />
            {error && (
                <p className="mt-1 text-xs text-red-500 animate-in fade-in slide-in-from-top-1">{error}</p>
            )}
        </div>
    );
};

export default AuthInput;
