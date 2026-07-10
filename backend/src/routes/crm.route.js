import { Router } from "express";
import upload from "../config/multer.js";
import {
	createProjectController,
	importCSV,
	getCRMRecordsController,
	getProjectsController,
	getProjectController,
	getImportsByProjectController,
	getImportController,
	getCRMRecordsByImportController,
	getSkippedRecordsController,
	getImportStatsController
} from "../controllers/crm.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
	createProjectValidation,
	importCSVValidation,
	projectIdValidation,
	importIdValidation,
	paginationValidation
} from "../validation/crm.validation.js";
const router = Router();

/**
 * @route GET /api/crm/projects
 * @desc Get all CRM projects
 * @access Private
 */
router.get("/projects", authMiddleware, getProjectsController);

/**
 * @route POST /api/crm/project
 * @desc Create a new project
 * @access Private
 */
router.post("/project", authMiddleware, createProjectValidation, validate, createProjectController);

/**
 * @route GET /api/crm/project/:projectId
 * @desc Get a specific CRM project
 * @access Private
 */
router.get("/project/:projectId", authMiddleware, projectIdValidation, validate, getProjectController);

/**
 * @route GET /api/crm/projects/:projectId/imports
 * @desc Get imports for a specific project
 * @access Private
 */
router.get(
	"/projects/:projectId/imports",
	authMiddleware,
	projectIdValidation,
	paginationValidation,
	validate,
	getImportsByProjectController
);

/**
 * @route POST /api/crm/import
 * @desc Import CSV data for a specific project
 * @access Private
 */
router.post(
	"/import",
	authMiddleware,
	upload.single("file"),
	importCSVValidation,
	validate,
	importCSV
);

/**
 * @route GET /api/crm/imports/:importId
 * @desc Get an import record by id
 * @access Private
 */
router.get("/imports/:importId", authMiddleware, importIdValidation, validate, getImportController);

/**
 * @route GET /api/crm/imports/:importId/records
 * @desc Get CRM records for a specific import
 * @access Private
 */
router.get(
	"/imports/:importId/records",
	authMiddleware,
	importIdValidation,
	paginationValidation,
	validate,
	getCRMRecordsByImportController
);

/**
 * @route GET /api/crm/imports/:importId/skipped
 * @desc Get skipped records for a specific import
 * @access Private
 */
router.get(
	"/imports/:importId/skipped",
	authMiddleware,
	importIdValidation,
	paginationValidation,
	validate,
	getSkippedRecordsController
);

/**
 * @route GET /api/crm/imports/:importId/stats
 * @desc Get import summary stats
 * @access Private
 */
router.get("/imports/:importId/stats", authMiddleware, importIdValidation, validate, getImportStatsController);

/**
 * @route GET /api/crm/records/:projectId
 * @desc Get CRM records for a specific project
 * @access Private
 */
router.get(
	"/records/:projectId",
	authMiddleware,
	projectIdValidation,
	paginationValidation,
	validate,
	getCRMRecordsController
);

export default router;