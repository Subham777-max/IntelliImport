import importModel from "../models/import.model.js";
import crmModel from "../models/crm.model.js";
import skippedModel from "../models/skipped.model.js";
import projectModel from "../models/project.model.js";


export const createProject = async (name, userId) => {
    const newProject = new projectModel({
        title: name,
        createdBy: userId
    });
    return await newProject.save();
}

export const getProjects = async (userId) => {
    return await projectModel.find({ createdBy: userId }).sort({ createdAt: -1 });
};

export const getProjectById = async (projectId) => {
    return await projectModel.findById(projectId);
};

export const saveCRMRecords = async (importId, projectId, records) => {
    const crmRecords = records.imported.map((record) => ({
        importId,
        projectId,
        ...record
    }));
    if (crmRecords.length > 0) {
        await crmModel.insertMany(crmRecords);
    }

    const skippedRecords = records.skipped.map((skipped) => ({
        importId,
        projectId,
        originalRecord: skipped.originalRecord,
        reason: skipped.reason
    }));
    if (skippedRecords.length > 0) {
        await skippedModel.insertMany(skippedRecords);
    }

    return { importedCount: crmRecords.length, skippedCount: skippedRecords.length };
};

export const updateImportProgress = async (importId,importedRows,skippedRows ,status) => {
     return await importModel.findByIdAndUpdate(
        importId,
        {
            $inc: {
                importedRows,
                skippedRows,
                totalRows: importedRows + skippedRows
            },
            $set: {
                status
            }
        },
        {
            returnDocument: "after"
        }
    );
}

export const createImportRecord = async (projectId, fileName) => {
    const newImport = new importModel({
        projectId,
        fileName,
        status: "processing",
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0
    });
    return await newImport.save();
}

export const getImportById = async (importId) => {
    return await importModel.findById(importId);
}

export const getImportsByProjectId = async (projectId, page = 1, limit = 20) => {
    return await importModel.find({ projectId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
};

export const getCRMRecords = async (
    projectId,
    page = 1,
    limit = 50
) => {

    return await crmModel.find({ projectId })
        .skip((page - 1) * limit)
        .limit(limit);

}

export const getCRMRecordsByImportId = async (
    importId,
    page = 1,
    limit = 50
) => {
    return await crmModel.find({ importId })
        .skip((page - 1) * limit)
        .limit(limit);
}

export const getCRMRecordCount = async (importId) => {

    return await crmModel.countDocuments({
        importId
    });

}

export const getSkippedRecordCount = async (importId) => {
    return await skippedModel.countDocuments({
        importId
    });
};

export const getSkippedRecords = async (
    importId,
    page = 1,
    limit = 20
) => {

    return await skippedModel.find({
        importId
    })
    .skip((page - 1) * limit)
    .limit(limit);

}