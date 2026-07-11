import React, { createContext, useState, useCallback, useEffect } from 'react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    const [visible, setVisible] = useState(false);

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
        // Small delay to ensure the DOM element is mounted before triggering the transition
        setTimeout(() => setVisible(true), 10);
        setTimeout(() => {
            setVisible(false);
            setTimeout(() => {
                setToast((currentToast) => {
                    if (currentToast && currentToast.message === message) {
                        return null;
                    }
                    return currentToast;
                });
            }, 300); // Wait for fade out animation
        }, 4000); // 4 seconds duration
    }, []);

    const hideToast = useCallback(() => {
        setVisible(false);
        setTimeout(() => setToast(null), 300);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {toast && (
                <div 
                    className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
                        visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
                    }`}
                >
                    <div className={`px-5 py-3 rounded-md shadow-lg flex items-center justify-between gap-4 text-sm font-medium border ${
                        toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                        toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        toast.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-zinc-800 text-zinc-100 border-zinc-700'
                    }`}>
                        <span>{toast.message}</span>
                        <button onClick={hideToast} className="text-current opacity-60 hover:opacity-100 focus:outline-none cursor-pointer">
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
};
