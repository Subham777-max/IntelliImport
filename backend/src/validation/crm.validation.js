import { body, check, param, query } from "express-validator";

export const createProjectValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Project name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Project name must be between 2 and 100 characters"),
];

export const importCSVValidation = [
    body("projectId")
        .notEmpty()
        .withMessage("Project ID is required")
        .isMongoId()
        .withMessage("Project ID must be a valid MongoDB ObjectId"),
    check("file")
        .custom((_, { req }) => Boolean(req.file))
        .withMessage("CSV file is required"),
];

export const projectIdValidation = [
    param("projectId")
        .notEmpty()
        .withMessage("Project ID is required")
        .isMongoId()
        .withMessage("Project ID must be a valid MongoDB ObjectId"),
];

export const importIdValidation = [
    param("importId")
        .notEmpty()
        .withMessage("Import ID is required")
        .isMongoId()
        .withMessage("Import ID must be a valid MongoDB ObjectId"),
];

export const paginationValidation = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer")
        .toInt(),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 200 })
        .withMessage("Limit must be between 1 and 200")
        .toInt(),
];