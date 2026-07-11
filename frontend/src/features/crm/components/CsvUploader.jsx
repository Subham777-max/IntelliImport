import React, { useCallback, useState } from 'react';

const CsvUploader = ({ onFileSelect }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
        else if (e.type === 'dragleave') setIsDragging(false);
    }, []);

    const validateAndProcess = (file) => {
        setError(null);
        if (!file) return;
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }
        onFileSelect(file);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) validateAndProcess(e.dataTransfer.files[0]);
    }, [onFileSelect]);

    const handleChange = (e) => {
        if (e.target.files?.[0]) validateAndProcess(e.target.files[0]);
    };

    return (
        <div className="w-full">
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-all ${
                    isDragging
                        ? 'border-black bg-neutral-50 scale-[1.01]'
                        : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50'
                }`}
            >
                <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-neutral-700">
                    Drag & drop your CSV here
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">or click below to browse</p>
                <input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={handleChange} />
                <label
                    htmlFor="csv-upload"
                    className="mt-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md cursor-pointer hover:bg-neutral-800 transition-colors"
                >
                    Browse Files
                </label>
                <p className="mt-3 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">CSV files only</p>
            </div>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
    );
};

export default CsvUploader;
