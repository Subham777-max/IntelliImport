import { parseCSV,splitIntoBatches } from "../service/csv.service.js";
import { processBatch } from "../service/ai.service.js";
import catchAsync from "../utils/catchAsync.js";
import {
    createImportRecord,
    saveCRMRecords,
    updateImportProgress,
    createProject,
    getCRMRecords
} from "../dao/crm.dao.js";

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
    const project = await createProject(name);
    res.status(201).json({
        success: true,
        project
    });
});

export const getCRMRecordsController = catchAsync(async (req, res, next) => {
    const { projectId,page,limit } = req.params;
    const records = await getCRMRecords(projectId, parseInt(page), parseInt(limit));
    res.status(200).json({
        success: true,
        records
    });
});