import { api } from "../../../api/api";

const DEFAULT_PAGE = 1;

const withPaginationDefaults = (params = {}, defaultLimit = 20) => ({
	page: DEFAULT_PAGE,
	limit: defaultLimit,
	...params,
});

export const getProjects = async () => {
	const response = await api.get("/crm/projects");
	return response.data;
};

export const createProject = async (payload) => {
	const response = await api.post("/crm/project", payload);
	return response.data;
};

export const getProject = async (projectId) => {
	const response = await api.get(`/crm/project/${projectId}`);
	return response.data;
};

export const deleteProject = async (projectId) => {
	const response = await api.delete(`/crm/project/${projectId}`);
	return response.data;
};

export const getImportsByProject = async (projectId, params = {}) => {
	const response = await api.get(`/crm/projects/${projectId}/imports`, {
		params: withPaginationDefaults(params, 20),
	});
	return response.data;
};

export const importCSV = async ({ file, projectId }) => {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("projectId", projectId);

	const response = await api.post("/crm/import", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});

	return response.data;
};

export const getImport = async (importId) => {
	const response = await api.get(`/crm/imports/${importId}`);
	return response.data;
};

export const getCRMRecordsByImport = async (importId, params = {}) => {
	const response = await api.get(`/crm/imports/${importId}/records`, {
		params: withPaginationDefaults(params, 50),
	});
	return response.data;
};

export const getSkippedRecords = async (importId, params = {}) => {
	const response = await api.get(`/crm/imports/${importId}/skipped`, {
		params: withPaginationDefaults(params, 20),
	});
	return response.data;
};

export const getImportStats = async (importId) => {
	const response = await api.get(`/crm/imports/${importId}/stats`);
	return response.data;
};

export const getCRMRecords = async (projectId, params = {}) => {
	const response = await api.get(`/crm/records/${projectId}`, {
		params: withPaginationDefaults(params, 50),
	});
	return response.data;
};

const crmService = {
	getProjects,
	createProject,
	getProject,
	deleteProject,
	getImportsByProject,
	importCSV,
	getImport,
	getCRMRecordsByImport,
	getSkippedRecords,
	getImportStats,
	getCRMRecords,
};

export default crmService;
