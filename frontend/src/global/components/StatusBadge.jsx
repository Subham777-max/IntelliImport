import React from 'react';

const StatusBadge = ({ status }) => {
    const map = {
        completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        processing:  { label: 'Processing',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
        failed:      { label: 'Failed',      cls: 'bg-red-50 text-red-700 border-red-200' },
        pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
        active:      { label: 'Active',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    };

    const config = map[status?.toLowerCase()] || { label: status || '—', cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border rounded-full ${config.cls}`}>
            {config.label}
        </span>
    );
};

export default StatusBadge;
