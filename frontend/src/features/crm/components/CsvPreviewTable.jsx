import React from 'react';

const CsvPreviewTable = ({ headers, data, fileName }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-10 text-sm text-neutral-500">No data to preview.</div>
        );
    }

    return (
        <div className="w-full flex flex-col border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-semibold text-neutral-700">{fileName || 'Preview'}</span>
                    <span className="text-[10px] text-neutral-400">— {headers.length} columns</span>
                </div>
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">{data.length} rows</span>
            </div>

            <div className="overflow-auto max-h-[420px]">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead className="sticky top-0 z-10 bg-neutral-50 shadow-[0_1px_0_0_#e5e5e5]">
                        <tr>
                            <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-r border-neutral-200 w-10 text-center">#</th>
                            {headers.map((h, i) => (
                                <th key={i} className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap border-r border-neutral-200 last:border-r-0">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, ri) => (
                            <tr key={ri} className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors ${ri % 2 === 1 ? 'bg-neutral-50/50' : 'bg-white'}`}>
                                <td className="px-3 py-2 text-[10px] text-neutral-400 font-medium text-center border-r border-neutral-200">{ri + 1}</td>
                                {headers.map((h, ci) => (
                                    <td key={ci} className="px-3 py-2 text-xs text-neutral-700 whitespace-nowrap max-w-[260px] truncate border-r border-neutral-100 last:border-r-0" title={row[h]}>
                                        {row[h] !== undefined && row[h] !== '' ? row[h] : <span className="text-neutral-300">—</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CsvPreviewTable;
