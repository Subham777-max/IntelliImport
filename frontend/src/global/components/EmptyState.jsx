import React from 'react';

const EmptyState = ({ icon, title, subtitle, action }) => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-center mb-4">
            {icon || (
                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
            )}
        </div>
        <p className="text-sm font-semibold text-neutral-800">{title}</p>
        {subtitle && <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);

export default EmptyState;
