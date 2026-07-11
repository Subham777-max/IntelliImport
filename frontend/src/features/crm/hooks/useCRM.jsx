import { useCallback, useContext } from "react";
import { CRMContext } from "../crm.context";
import crmService from "../service/crm.service";

export function useCRM() {
    const {
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
    } = useContext(CRMContext);

    const handleGetProjects = useCallback(async () => {
        try {
            setLoadingState("projects", true);
            const response = await crmService.getProjects();
            setProjects(response.projects);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("projects", false);
        }
    }, [setError, setLoadingState, setProjects]);

    const handleCreateProject = useCallback(async (name) => {
        try {
            setLoadingState("createProject", true);
            const response = await crmService.createProject({ name });
            setSelectedProject(response.project);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("createProject", false);
        }
    }, [setError, setLoadingState, setSelectedProject]);

    const handleDeleteProject = useCallback(async (projectId) => {
        try {
            setLoadingState("deleteProject", true);
            const response = await crmService.deleteProject(projectId);
            setProjects(prev => prev.filter(p => p._id !== projectId));
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("deleteProject", false);
        }
    }, [setError, setLoadingState, setProjects]);

    const handleGetProject = useCallback(async (projectId) => {
        try {
            setLoadingState("projectDetails", true);
            const response = await crmService.getProject(projectId);
            setSelectedProject(response.project);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("projectDetails", false);
        }
    }, [setError, setLoadingState, setSelectedProject]);

    const handleGetImportsByProject = useCallback(async (projectId, params = {}) => {
        try {
            setLoadingState("imports", true);
            const response = await crmService.getImportsByProject(projectId, params);
            setImports(response.imports);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("imports", false);
        }
    }, [setError, setImports, setLoadingState]);

    const handleImportCSV = useCallback(async ({ file, projectId }) => {
        try {
            setLoadingState("importCSV", true);
            const response = await crmService.importCSV({ file, projectId });
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("importCSV", false);
        }
    }, [setError, setLoadingState]);

    const handleGetImport = useCallback(async (importId) => {
        try {
            setLoadingState("importDetails", true);
            const response = await crmService.getImport(importId);
            setSelectedImport(response.importRecord);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("importDetails", false);
        }
    }, [setError, setLoadingState, setSelectedImport]);

    const handleGetCRMRecordsByImport = useCallback(async (importId, params = {}) => {
        try {
            setLoadingState("records", true);
            const response = await crmService.getCRMRecordsByImport(importId, params);
            setRecords(response.records);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("records", false);
        }
    }, [setError, setLoadingState, setRecords]);

    const handleGetSkippedRecords = useCallback(async (importId, params = {}) => {
        try {
            setLoadingState("skippedRecords", true);
            const response = await crmService.getSkippedRecords(importId, params);
            setSkippedRecords(response.skippedRecords);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("skippedRecords", false);
        }
    }, [setError, setLoadingState, setSkippedRecords]);

    const handleGetImportStats = useCallback(async (importId) => {
        try {
            setLoadingState("stats", true);
            const response = await crmService.getImportStats(importId);
            setImportStats(response.stats);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("stats", false);
        }
    }, [setError, setImportStats, setLoadingState]);

    const handleGetCRMRecords = useCallback(async (projectId, params = {}) => {
        try {
            setLoadingState("records", true);
            const response = await crmService.getCRMRecords(projectId, params);
            setRecords(response.records);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
        } finally {
            setLoadingState("records", false);
        }
    }, [setError, setLoadingState, setRecords]);

    return {
        projects,
        selectedProject,
        imports,
        selectedImport,
        records,
        skippedRecords,
        importStats,
        loading,
        error,
        handleGetProjects,
        handleCreateProject,
        handleDeleteProject,
        handleGetProject,
        handleGetImportsByProject,
        handleImportCSV,
        handleGetImport,
        handleGetCRMRecordsByImport,
        handleGetSkippedRecords,
        handleGetImportStats,
        handleGetCRMRecords,
        setSelectedProject,
        setSelectedImport,
        setProjects,
        setImports,
        setRecords,
        setSkippedRecords,
        setImportStats,
        setError,
    };
}