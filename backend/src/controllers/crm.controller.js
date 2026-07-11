import { parseCSV,splitIntoBatches } from "../service/csv.service.js";
import { processBatch } from "../service/ai.service.js";
import catchAsync from "../utils/catchAsync.js";
import {
    createImportRecord,
    saveCRMRecords,
    updateImportProgress,
    createProject,
    getCRMRecords,
    getProjects,
    getProjectById,
    getImportById,
    getImportsByProjectId,
    getCRMRecordsByImportId,
    getCRMRecordCount,
    getSkippedRecordCount,
    getSkippedRecords,
    deleteProject
} from "../dao/crm.dao.js";
import NotFoundError from "../utils/errors/NotFoundError.js";
import AppError from "../utils/errors/AppError.js";

export const importCSV = catchAsync(async (req, res, next) => {


    const { projectId } = req.body;

    const file = req.file;

    // 1. Create Import
    const importDoc = await createImportRecord(
        projectId,
        file.originalname
    );

    // 2. Parse CSV
    const rows = parseCSV(file.buffer.toString("utf-8"));

    // 3. Split batches
    const batches = splitIntoBatches(rows, 100);

    // 4. Process every batch
    for (const batch of batches) {

        const aiResponse = await processBatch(batch);

        const stats = await saveCRMRecords(
            importDoc._id,
            projectId,
            aiResponse
        );

        await updateImportProgress(
            importDoc._id,
            stats.importedCount,
            stats.skippedCount,
            "processing"
        );

    }

    // 5. Mark completed
    await updateImportProgress(
        importDoc._id,
        0,
        0,
        "completed"
    );

    res.status(200).json({
        success: true,
        importId: importDoc._id
    });
});

export const createProjectController = catchAsync(async (req, res, next) => {
    const { name } = req.body;
    const project = await createProject(name, req.user.id);
    res.status(201).json({
        success: true,
        project
    });
});

export const getProjectsController = catchAsync(async (req, res, _next) => {
    const projects = await getProjects(req.user.id);
    res.status(200).json({
        success: true,
        projects
    });
});

export const getProjectController = catchAsync(async (req, res, _next) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    const project = await getProjectById(projectId);
    if(!project){
        throw new NotFoundError("Project not found");
    }
    if(project.createdBy.toString() !== userId){
        throw new AppError("Access denied", 403);
    }
    res.status(200).json({
        success: true,
        project
    });
});

export const getImportsByProjectController = catchAsync(async (req, res, _next) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    const project = await getProjectById(projectId);

    if (!project) {
        throw new NotFoundError("Project not found");
    }

    if (project.createdBy.toString() !== userId) {
        throw new AppError("Access denied", 403);
    }

    const page = parseInt(req.query.page ?? "1", 10);
    const limit = parseInt(req.query.limit ?? "20", 10);
    const imports = await getImportsByProjectId(projectId, page, limit);
    res.status(200).json({
        success: true,
        imports
    });
});

export const getImportController = catchAsync(async (req, res, _next) => {
    const { importId } = req.params;
    const importRecord = await getImportById(importId);
    res.status(200).json({
        success: true,
        importRecord
    });
});

export const getCRMRecordsController = catchAsync(async (req, res, next) => {
    const { projectId } = req.params;
    const page = parseInt(req.query.page ?? "1", 10);
    const limit = parseInt(req.query.limit ?? "50", 10);
    const records = await getCRMRecords(projectId, page, limit);
    res.status(200).json({
        success: true,
        records
    });
});

export const getCRMRecordsByImportController = catchAsync(async (req, res, _next) => {
    const { importId } = req.params;
    const page = parseInt(req.query.page ?? "1", 10);
    const limit = parseInt(req.query.limit ?? "50", 10);
    const records = await getCRMRecordsByImportId(importId, page, limit);
    res.status(200).json({
        success: true,
        records
    });
});

export const getSkippedRecordsController = catchAsync(async (req, res, _next) => {
    const { importId } = req.params;
    const page = parseInt(req.query.page ?? "1", 10);
    const limit = parseInt(req.query.limit ?? "20", 10);
    const skippedRecords = await getSkippedRecords(importId, page, limit);
    res.status(200).json({
        success: true,
        skippedRecords
    });
});

export const getImportStatsController = catchAsync(async (req, res, _next) => {
    const { importId } = req.params;
    const importRecord = await getImportById(importId);
    const importedRows = await getCRMRecordCount(importId);
    const skippedRows = await getSkippedRecordCount(importId);

    res.status(200).json({
        success: true,
        stats: {
            importRecord,
            importedRows,
            skippedRows,
        }
    });
});

export const deleteProjectController = catchAsync(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    const project = await getProjectById(projectId);
    
    if (!project) {
        throw new NotFoundError("Project not found");
    }
    
    if (project.createdBy.toString() !== userId) {
        throw new AppError("Access denied", 403);
    }
    
    await deleteProject(projectId);
    
    res.status(200).json({
        success: true,
        message: "Project and all associated records deleted successfully"
    });
});