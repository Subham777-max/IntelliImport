import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRM } from '../hooks/useCRM';
import { useToast } from '../../../global/hooks/useToast';
import { parseCSV } from '../../../utils/csvParser';
import AppLayout from '../../../global/components/AppLayout';
import CsvUploader from '../components/CsvUploader';
import CsvPreviewTable from '../components/CsvPreviewTable';
import StatusBadge from '../../../global/components/StatusBadge';
import EmptyState from '../../../global/components/EmptyState';
import { Btn, GhostBtn } from '../../../global/components/Buttons';

const CRM_COLUMNS = [
    'name','email','country_code','mobile_without_country_code',
    'company','city','state','country','lead_owner',
    'crm_status','crm_note','data_source','possession_time','description','created_at',
];

const StatCard = ({ label, value }) => (
    <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-xl font-bold text-neutral-900 mt-1 tabular-nums">{value ?? 0}</p>
    </div>
);

const Pagination = ({ page, hasPrev, hasNext, onPrev, onNext }) => (
    <div className="flex items-center gap-1 px-4 py-2.5 border-t border-neutral-100 justify-end bg-neutral-50/40">
        <button onClick={onPrev} disabled={!hasPrev} className="px-2.5 py-1 text-xs text-neutral-600 border border-neutral-200 rounded hover:bg-neutral-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">← Prev</button>
        <span className="px-3 text-xs text-neutral-500 font-medium">Page {page}</span>
        <button onClick={onNext} disabled={!hasNext} className="px-2.5 py-1 text-xs text-neutral-600 border border-neutral-200 rounded hover:bg-neutral-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">Next →</button>
    </div>
);

const CRMTable = ({ records, loading }) => {
    const [expandedCell, setExpandedCell] = useState(null);
    if (loading) return <div className="flex justify-center p-10"><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>;
    if (!records.length) return <EmptyState title="No records found" subtitle="No CRM records available for this selection." />;
    return (
        <div className="overflow-auto max-h-[480px]">
            <table className="w-full text-left border-collapse min-w-max">
                <thead className="sticky top-0 z-10 bg-neutral-50 shadow-[0_1px_0_0_#e5e5e5]">
                    <tr>{CRM_COLUMNS.map(col => <th key={col} className="px-3 py-2 text-[10px] font-semibold text-neutral-500 whitespace-nowrap border-r border-neutral-200 last:border-r-0">{col}</th>)}</tr>
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
                                            className={`px-3 py-2 text-xs text-neutral-700 border-r border-neutral-100 last:border-r-0 cursor-pointer ${isExpanded ? 'whitespace-normal min-w-[250px] bg-neutral-100/50' : 'whitespace-nowrap max-w-[180px] truncate'}`} 
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

const SkippedTable = ({ records, loading }) => {
    if (loading) return <div className="flex justify-center p-10"><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>;
    if (!records.length) return <EmptyState title="No skipped records" subtitle="All records from this import were processed successfully." />;
    return (
        <div className="overflow-auto max-h-[480px]">
            <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-neutral-50 shadow-[0_1px_0_0_#e5e5e5]">
                    <tr>
                        <th className="px-4 py-2 text-[10px] font-semibold text-neutral-500 whitespace-nowrap">original_record</th>
                        <th className="px-4 py-2 text-[10px] font-semibold text-neutral-500 w-52">reason</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((rec, i) => (
                        <tr key={rec._id || i} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors">
                            <td className="px-4 py-2.5 text-xs text-neutral-500 font-mono truncate max-w-[520px]">
                                {typeof rec.originalRecord === 'object' ? JSON.stringify(rec.originalRecord) : rec.originalRecord || '—'}
                            </td>
                            <td className="px-4 py-2.5">
                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-100 rounded-full">{rec.reason || 'Unknown'}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ProcessingScreen = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 gap-4 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <div>
            <p className="text-sm font-semibold text-neutral-800">AI is processing your CSV</p>
            <p className="text-xs text-neutral-400 mt-1">Columns are being mapped to CRM fields. Please wait.</p>
        </div>
    </div>
);

const ProjectPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const {
        selectedProject, imports, records, skippedRecords, loading, error,
        handleGetProject, handleGetImportsByProject, handleImportCSV,
        handleGetCRMRecords, handleGetCRMRecordsByImport, handleGetSkippedRecords,
    } = useCRM();

    const [file, setFile] = useState(null);
    const [csvData, setCsvData] = useState(null);
    const [view, setView] = useState('overview');
    const [selectedImportId, setSelectedImportId] = useState(null);
    const [activeTab, setActiveTab] = useState('imported'); // 'imported' | 'skipped'
    const [recordsPage, setRecordsPage] = useState(1);
    const [skippedPage, setSkippedPage] = useState(1);
    const [hasMoreRecords, setHasMoreRecords] = useState(false);
    const [hasMoreSkipped, setHasMoreSkipped] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle
    const LIMIT = 50;
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        handleGetProject(projectId);
        handleGetImportsByProject(projectId);
    }, []); // eslint-disable-line

    // Fetch imported records
    useEffect(() => {
        if (view !== 'overview' || activeTab !== 'imported') return;
        const fetcher = selectedImportId
            ? handleGetCRMRecordsByImport(selectedImportId, { page: recordsPage, limit: LIMIT })
            : handleGetCRMRecords(projectId, { page: recordsPage, limit: LIMIT });
        fetcher.then(res => setHasMoreRecords((res?.records?.length ?? 0) === LIMIT));
    }, [view, activeTab, selectedImportId, recordsPage]); // eslint-disable-line

    // Fetch skipped records (only when a specific import is selected)
    useEffect(() => {
        if (view !== 'overview' || activeTab !== 'skipped' || !selectedImportId) return;
        handleGetSkippedRecords(selectedImportId, { page: skippedPage, limit: LIMIT })
            .then(res => setHasMoreSkipped((res?.skippedRecords?.length ?? 0) === LIMIT));
    }, [view, activeTab, selectedImportId, skippedPage]); // eslint-disable-line

    useEffect(() => {
        if (error) showToast(error.response?.data?.message || error.message || 'Something went wrong', 'error');
    }, [error]); // eslint-disable-line

    const selectImport = (id) => {
        setSelectedImportId(id);
        setActiveTab('imported');
        setRecordsPage(1);
        setSkippedPage(1);
        setSidebarOpen(false);
    };

    const handleFileSelect = async (selectedFile) => {
        setFile(selectedFile);
        try {
            const parsed = await parseCSV(selectedFile);
            if (!parsed.headers.length) { showToast('CSV appears empty.', 'error'); return; }
            setCsvData(parsed);
            setView('preview');
        } catch { showToast('Failed to parse CSV file.', 'error'); }
    };

    const handleConfirmImport = async () => {
        if (!file) return;
        setView('processing');
        const res = await handleImportCSV({ file, projectId });
        if (res?.importId) {
            showToast('Import completed!', 'success');
            setFile(null); setCsvData(null);
            hasFetched.current = false;
            await handleGetProject(projectId);
            await handleGetImportsByProject(projectId);
            hasFetched.current = true;
            setSelectedImportId(null);
            setActiveTab('imported');
            setRecordsPage(1);
            setView('overview');
        } else {
            showToast('Import failed. Please try again.', 'error');
            setView('preview');
        }
    };

    const handleCancel = () => { setFile(null); setCsvData(null); setView('overview'); };

    const project = selectedProject;
    const createdAt = project?.createdAt ? new Date(project.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
    const totalImported = imports.reduce((s, i) => s + (i.importedRows ?? 0), 0);
    const totalSkipped  = imports.reduce((s, i) => s + (i.skippedRows  ?? 0), 0);
    const totalRows     = imports.reduce((s, i) => s + (i.totalRows    ?? 0), 0);
    const activeImport  = imports.find(i => i._id === selectedImportId);

    if (loading.projectDetails && !project) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-4">
                    <div className="h-5 w-40 bg-neutral-200 rounded animate-pulse" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-neutral-200 rounded-lg animate-pulse" />)}</div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">

                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <button onClick={() => navigate('/')} className="hover:text-neutral-700 cursor-pointer transition-colors">Projects</button>
                    <span>/</span>
                    <span className="text-neutral-700 font-medium truncate">{project?.title || '...'}</span>
                </div>

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-sm font-semibold text-neutral-900 truncate">{project?.title}</h1>
                        <p className="text-xs text-neutral-400 mt-0.5">Created {createdAt}</p>
                    </div>
                    {view === 'overview' && (
                        <Btn onClick={() => setView('upload')} className="shrink-0">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span className="hidden sm:inline">Upload CSV</span>
                            <span className="sm:hidden">Upload</span>
                        </Btn>
                    )}
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="CSV Imports" value={imports.length} />
                    <StatCard label="Total Rows"  value={totalRows} />
                    <StatCard label="Imported"    value={totalImported} />
                    <StatCard label="Skipped"     value={totalSkipped} />
                </div>

                {/* UPLOAD */}
                {view === 'upload' && (
                    <div className="bg-white border border-neutral-200 rounded-lg">
                        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-neutral-100">
                            <h2 className="text-xs font-semibold text-neutral-800">Upload CSV File</h2>
                            <GhostBtn onClick={handleCancel}>Cancel</GhostBtn>
                        </div>
                        <div className="p-4 sm:p-6"><CsvUploader onFileSelect={handleFileSelect} /></div>
                    </div>
                )}

                {/* PREVIEW */}
                {view === 'preview' && csvData && (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xs font-semibold text-neutral-800">CSV Preview</h2>
                                <p className="text-[11px] text-neutral-400 mt-0.5">Review your data. AI processing starts only after you confirm.</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <GhostBtn onClick={handleCancel}>Cancel</GhostBtn>
                                <Btn onClick={handleConfirmImport} loading={loading.importCSV}>Confirm & Import</Btn>
                            </div>
                        </div>
                        <CsvPreviewTable headers={csvData.headers} data={csvData.data} fileName={file?.name} />
                    </div>
                )}

                {/* PROCESSING */}
                {view === 'processing' && (
                    <div className="bg-white border border-neutral-200 rounded-lg"><ProcessingScreen /></div>
                )}

                {/* OVERVIEW: Split layout */}
                {view === 'overview' && (
                    <div className="flex flex-col lg:flex-row gap-4 items-start">

                        {/* Mobile: File selector dropdown */}
                        <div className="lg:hidden w-full bg-white border border-neutral-200 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-100">
                                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">CSV File</p>
                                <button onClick={() => setSidebarOpen(o => !o)} className="text-xs text-neutral-500 hover:text-black cursor-pointer transition-colors">
                                    {sidebarOpen ? 'Close ↑' : 'Browse ↓'}
                                </button>
                            </div>
                            {/* Active selection summary */}
                            <div className="px-3 py-2 text-xs font-medium text-neutral-700">
                                {selectedImportId ? (activeImport?.fileName || 'File') : 'All Records'}
                            </div>
                            {/* Dropdown list */}
                            {sidebarOpen && (
                                <div className="border-t border-neutral-100 divide-y divide-neutral-100 max-h-48 overflow-auto">
                                    <button onClick={() => selectImport(null)} className={`w-full text-left px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${!selectedImportId ? 'bg-black text-white' : 'hover:bg-neutral-50'}`}>
                                        All Records ({totalImported} imported)
                                    </button>
                                    {imports.map(imp => (
                                        <button key={imp._id} onClick={() => selectImport(imp._id)} className={`w-full text-left px-3 py-2.5 transition-colors cursor-pointer ${selectedImportId === imp._id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}>
                                            <p className="text-[11px] font-medium truncate">{imp.fileName}</p>
                                            <p className={`text-[10px] ${selectedImportId === imp._id ? 'text-neutral-300' : 'text-neutral-400'}`}>{imp.importedRows ?? 0} imported · {imp.skippedRows ?? 0} skipped</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Desktop: Sidebar */}
                        <div className="hidden lg:flex w-56 shrink-0 flex-col bg-white border border-neutral-200 rounded-lg overflow-hidden">
                            <div className="px-3 py-2.5 border-b border-neutral-100">
                                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">CSV Files</p>
                            </div>
                            <button onClick={() => selectImport(null)} className={`flex items-center gap-2 px-3 py-2.5 text-left border-b border-neutral-100 transition-colors cursor-pointer ${!selectedImportId ? 'bg-black text-white' : 'hover:bg-neutral-50 text-neutral-700'}`}>
                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold truncate">All Records</p>
                                    <p className={`text-[10px] ${!selectedImportId ? 'text-neutral-300' : 'text-neutral-400'}`}>{totalImported} imported</p>
                                </div>
                            </button>
                            <div className="divide-y divide-neutral-100 overflow-y-auto max-h-[400px] flex-1">
                                {loading.imports ? (
                                    <div className="p-3 space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />)}</div>
                                ) : imports.length === 0 ? (
                                    <div className="px-3 py-4 text-center"><p className="text-[11px] text-neutral-400">No files yet</p></div>
                                ) : imports.map(imp => {
                                    const isActive = selectedImportId === imp._id;
                                    return (
                                        <button key={imp._id} onClick={() => selectImport(imp._id)} className={`w-full flex items-start gap-2 px-3 py-2.5 text-left transition-colors cursor-pointer ${isActive ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50 text-neutral-700'}`}>
                                            <svg className="w-3 h-3 mt-0.5 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-medium truncate leading-tight">{imp.fileName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[9px] font-semibold ${isActive ? 'text-neutral-300' : 'text-emerald-600'}`}>{imp.importedRows ?? 0}↑</span>
                                                    <span className={`text-[9px] font-semibold ${isActive ? 'text-neutral-300' : 'text-amber-500'}`}>{imp.skippedRows ?? 0}↓</span>
                                                    <span className={`ml-auto inline-block w-1.5 h-1.5 rounded-full ${imp.status === 'completed' ? 'bg-emerald-400' : imp.status === 'processing' ? 'bg-blue-400' : 'bg-red-400'}`} />
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="p-2 border-t border-neutral-100">
                                <button onClick={() => setView('upload')} className="w-full px-2 py-1.5 text-[10px] font-semibold text-neutral-500 hover:text-black hover:bg-neutral-50 rounded transition-colors cursor-pointer flex items-center justify-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                    Upload CSV
                                </button>
                            </div>
                        </div>

                        {/* Right: Records panel */}
                        <div className="flex-1 min-w-0 bg-white border border-neutral-200 rounded-lg overflow-hidden">
                            {/* Panel header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-4 py-2.5 border-b border-neutral-100 bg-neutral-50">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-neutral-800 truncate">
                                        {selectedImportId ? (activeImport?.fileName || 'File Records') : 'All CRM Records'}
                                    </p>
                                    {selectedImportId && activeImport && <StatusBadge status={activeImport.status} />}
                                </div>
                                {selectedImportId && activeImport && (
                                    <div className="flex items-center gap-3 text-[10px]">
                                        <span className="text-emerald-600 font-semibold">{activeImport.importedRows ?? 0} imported</span>
                                        <span className="text-amber-500 font-semibold">{activeImport.skippedRows ?? 0} skipped</span>
                                    </div>
                                )}
                            </div>

                            {/* Tabs — only when a specific file is selected */}
                            {selectedImportId && (
                                <div className="flex border-b border-neutral-100">
                                    {[
                                        { key: 'imported', label: `Imported (${activeImport?.importedRows ?? 0})` },
                                        { key: 'skipped',  label: `Skipped (${activeImport?.skippedRows ?? 0})` },
                                    ].map(t => (
                                        <button
                                            key={t.key}
                                            onClick={() => { setActiveTab(t.key); setRecordsPage(1); setSkippedPage(1); }}
                                            className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors border-b-2 -mb-px ${activeTab === t.key ? 'text-neutral-900 border-black' : 'text-neutral-400 border-transparent hover:text-neutral-700'}`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Table content */}
                            {activeTab === 'imported' || !selectedImportId ? (
                                <>
                                    <CRMTable records={records} loading={loading.records} />
                                    <Pagination page={recordsPage} hasPrev={recordsPage > 1} hasNext={hasMoreRecords} onPrev={() => setRecordsPage(p => p - 1)} onNext={() => setRecordsPage(p => p + 1)} />
                                </>
                            ) : (
                                <>
                                    <SkippedTable records={skippedRecords} loading={loading.skippedRecords} />
                                    <Pagination page={skippedPage} hasPrev={skippedPage > 1} hasNext={hasMoreSkipped} onPrev={() => setSkippedPage(p => p - 1)} onNext={() => setSkippedPage(p => p + 1)} />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default ProjectPage;
