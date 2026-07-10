import { Router } from "express";
import upload from "../config/multer.js";
import Papa from "papaparse";
import { createProjectController,importCSV,getCRMRecordsController } from "../controllers/crm.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
const router = Router();

/**
 * @route POST /api/crm/project
 * @desc Create a new project
 * @access Private
 */
router.post("/project", authMiddleware, createProjectController);

/**
 * @route POST /api/crm/import
 * @desc Import CSV data for a specific project
 * @access Private
 */
router.post("/import", authMiddleware, upload.single("file"), importCSV);

/**
 * @route GET /api/crm/records/:projectId
 * @desc Get CRM records for a specific project
 * @access Private
 */
router.get("/records/:projectId", authMiddleware, getCRMRecordsController);

export default router;