import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRM } from '../hooks/useCRM';
import { useToast } from '../../../global/hooks/useToast';
import AppLayout from '../../../global/components/AppLayout';
import StatusBadge from '../../../global/components/StatusBadge';
import EmptyState from '../../../global/components/EmptyState';

// ─── CRM Columns (from crm.model.js) ─────────────────────────────────────────
const CRM_COLUMNS = [
    'name',
    'email',
    'country_code',
    'mobile_without_country_code',
    'company',
    'city',
    'state',
    'country',
    'lead_owner',
    'crm_status',
    'crm_note',
    'data_source',
    'possession_time',
    'description',
    'created_at',
];

// ─── Simple Pagination ────────────────────────────────────────────────────────
const Pagination = ({ page, onPrev, onNext, hasPrev, hasNext }) => (
    <div className="flex items-center gap-1 px-4 py-2.5 border-t border-neutral-100 justify-end bg-neutral-50/50">
        <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="px-2.5 py-1 text-xs text-neutral-600 border border-neutral-200 rounded hover:bg-neutral-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
            ← Prev
        </button>
        <span className="px-3 text-xs text-neutral-500 font-medium">Page {page}</span>
        <button
            onClick={onNext}
            disabled={!hasNext}
            className="px-2.5 py-1 text-xs text-neutral-600 border border-neutral-200 rounded hover:bg-neutral-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
            Next →
        </button>
    </div>
);

// ─── CRM Records Table ────────────────────────────────────────────────────────
const CRMTable = ({ records, loading }) => {
    const [expandedCell, setExpandedCell] = useState(null);
    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (!records.length) {
        return <EmptyState title="No records found" subtitle="No CRM records were imported from this file." />;
    }
    return (
        <div className="overflow-auto max-h-[480px]">
            <table className="w-full text-left border-collapse min-w-max">
                <thead className="sticky top-0 z-10 bg-neutral-50 shadow-[0_1px_0_0_#e5e5e5]">
                    <tr>
                        {CRM_COLUMNS.map(col => (
                            <th key={col} className="px-4 py-2 text-[10px] font-semibold text-neutral-500 whitespace-nowrap border-r border-neutral-200 last:border-r-0">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {records.map((rec, i) => {
                        return (
                            <tr
                                key={rec._id || i}
                                className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors ${i % 2 === 1 ? 'bg-neutral-50/40' : ''}`}
                            >
                                {CRM_COLUMNS.map(col => {
                                    const cellId = `${rec._id || i}-${col}`;
                                    const isExpanded = expandedCell === cellId;
                                    return (
                                        <td
                                            key={col}
                                            onDoubleClick={() => setExpandedCell(isExpanded ? null : cellId)}
                                            className={`px-4 py-2 text-xs text-neutral-700 border-r border-neutral-100 last:border-r-0 cursor-pointer ${isExpanded ? 'whitespace-normal min-w-[250px] bg-neutral-100/50' : 'whitespace-nowrap max-w-[200px] truncate'}`}
                                            title={!isExpanded ? rec[col] : undefined}
                                        >
                                            {rec[col] || <span className="text-neutral-300">—</span>}
                                        </td>
                                    )
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ─── Skipped Records Table ────────────────────────────────────────────────────
const SkippedTable = ({ records, loading }) => {
    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (!records.length) {
        return (
            <EmptyState
                title="No skipped records"
                subtitle="All records from this import were processed successfully."
            />
        );
    }
    return (
        <div className="overflow-auto max-h-[480px]">
            <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-neutral-50 shadow-[0_1px_0_0_#e5e5e5]">
                    <tr>
                        <th className="px-4 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Original Record</th>
                        <th className="px-4 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider w-52">Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((rec, i) => (
                        <tr key={rec._id || i} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors">
                            <td className="px-4 py-2.5 text-xs text-neutral-500 font-mono truncate max-w-[520px]">
                                {typeof rec.originalRecord === 'object'
                                    ? JSON.stringify(rec.originalRecord)
                                    : rec.originalRecord || '—'}
                            </td>
                            <td className="px-4 py-2.5">
                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-100 rounded-full">
                                    {rec.reason || 'Unknown'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─── Import Detail Page ───────────────────────────────────────────────────────
const ImportDetailPage = () => {
    const { importId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const {
        selectedImport,
        records,
        skippedRecords,
        loading,
        error,
        handleGetImport,
        handleGetCRMRecordsByImport,
        handleGetSkippedRecords,
    } = useCRM();

    const [activeTab, setActiveTab] = useState('records');
    const [recordsPage, setRecordsPage] = useState(1);
    const [skippedPage, setSkippedPage] = useState(1);
    // Track if current page returned a full page (to know if there's a next page)
    const [recordsHasMore, setRecordsHasMore] = useState(false);
    const [skippedHasMore, setSkippedHasMore] = useState(false);
    const RECORDS_LIMIT = 50;
    const SKIPPED_LIMIT = 20;

    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        handleGetImport(importId);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (activeTab === 'records') {
            handleGetCRMRecordsByImport(importId, { page: recordsPage, limit: RECORDS_LIMIT }).then(res => {
                setRecordsHasMore((res?.records?.length ?? 0) === RECORDS_LIMIT);
            });
        }
    }, [activeTab, recordsPage]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (activeTab === 'skipped') {
            handleGetSkippedRecords(importId, { page: skippedPage, limit: SKIPPED_LIMIT }).then(res => {
                setSkippedHasMore((res?.skippedRecords?.length ?? 0) === SKIPPED_LIMIT);
            });
        }
    }, [activeTab, skippedPage]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (error) showToast(error.response?.data?.message || error.message || 'Something went wrong', 'error');
    }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

    const imp = selectedImport;
    const date = imp?.createdAt
        ? new Date(imp.createdAt).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })
        : '—';

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <button onClick={() => navigate('/')} className="hover:text-neutral-700 cursor-pointer transition-colors">
                        Projects
                    </button>
                    <span>/</span>
                    {imp?.projectId && (
                        <>
                            <button
                                onClick={() => navigate(`/project/${imp.projectId}`)}
                                className="hover:text-neutral-700 cursor-pointer transition-colors"
                            >
                                Project
                            </button>
                            <span>/</span>
                        </>
                    )}
                    <span className="text-neutral-700 font-medium">{imp?.fileName || 'Import Detail'}</span>
                </div>

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-semibold text-neutral-900">{imp?.fileName || 'Import Detail'}</h1>
                            {imp?.status && <StatusBadge status={imp.status} />}
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">Uploaded {date}</p>
                    </div>
                </div>

                {/* Summary cards — using actual fields from import.model.js */}
                {imp && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Rows',   value: imp.totalRows    ?? 0 },
                            { label: 'Imported',     value: imp.importedRows ?? 0 },
                            { label: 'Skipped',      value: imp.skippedRows  ?? 0 },
                            { label: 'Status',       value: imp.status       || '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{label}</p>
                                <p className="text-xl font-bold text-neutral-900 mt-1 leading-tight tabular-nums">{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tabs + Table */}
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex gap-0 border-b border-neutral-100">
                        {[
                            { key: 'records', label: `Imported Records${imp ? ` (${imp.importedRows ?? 0})` : ''}` },
                            { key: 'skipped', label: `Skipped Records${imp ? ` (${imp.skippedRows ?? 0})` : ''}` },
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`px-5 py-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
                                    activeTab === t.key
                                        ? 'text-neutral-900 border-black'
                                        : 'text-neutral-400 border-transparent hover:text-neutral-700'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Imported Records tab */}
                    {activeTab === 'records' && (
                        <>
                            <CRMTable records={records} loading={loading.records} />
                            <Pagination
                                page={recordsPage}
                                hasPrev={recordsPage > 1}
                                hasNext={recordsHasMore}
                                onPrev={() => setRecordsPage(p => p - 1)}
                                onNext={() => setRecordsPage(p => p + 1)}
                            />
                        </>
                    )}

                    {/* Skipped Records tab */}
                    {activeTab === 'skipped' && (
                        <>
                            <SkippedTable records={skippedRecords} loading={loading.skippedRecords} />
                            <Pagination
                                page={skippedPage}
                                hasPrev={skippedPage > 1}
                                hasNext={skippedHasMore}
                                onPrev={() => setSkippedPage(p => p - 1)}
                                onNext={() => setSkippedPage(p => p + 1)}
                            />
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default ImportDetailPage;
