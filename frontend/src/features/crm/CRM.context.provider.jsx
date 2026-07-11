import { useState } from "react";
import { CRMContext } from "./crm.context";

export const CRMProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [imports, setImports] = useState([]);
    const [selectedImport, setSelectedImport] = useState(null);
    const [records, setRecords] = useState([]);
    const [skippedRecords, setSkippedRecords] = useState([]);
    const [importStats, setImportStats] = useState(null);
    const [loading, setLoading] = useState({
        projects: false,
        projectDetails: false,
        imports: false,
        importDetails: false,
        records: false,
        skippedRecords: false,
        stats: false,
        createProject: false,
        importCSV: false,
    });
    const [error, setError] = useState(null);

    const setLoadingState = (key, value) => {
        setLoading((current) => ({
            ...current,
            [key]: value,
        }));
    };

    return (
        <CRMContext.Provider
            value={{
                projects,
                setProjects,
                selectedProject,
                setSelectedProject,
                imports,
                setImports,
                selectedImport,
                setSelectedImport,
                records,
                setRecords,
                skippedRecords,
                setSkippedRecords,
                importStats,
                setImportStats,
                loading,
                setLoadingState,
                error,
                setError,
            }}
        >
            {children}
        </CRMContext.Provider>
    );
};