import React from 'react';

// Primary black button
export const Btn = ({ children, onClick, type = 'button', disabled = false, loading = false, className = '' }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {loading && (
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
        )}
        {children}
    </button>
);

// Outlined ghost button
export const GhostBtn = ({ children, onClick, type = 'button', disabled = false, className = '' }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-neutral-800 text-xs font-semibold border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Danger outlined button
export const DangerBtn = ({ children, onClick, type = 'button', disabled = false, className = '' }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 text-xs font-semibold border border-red-200 rounded-md hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);
