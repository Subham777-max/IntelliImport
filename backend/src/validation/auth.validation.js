import { body } from "express-validator";

export const loginValidation = [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
];

export const registerValidation = [
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("email").isEmail().normalizeEmail(),
    body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 32 })
    .withMessage("Password must be between 8 and 32 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[@$!%*?&]/)
    .withMessage("Password must contain at least one special character (@$!%*?&)")
    .not()
    .matches(/\s/)
    .withMessage("Password must not contain spaces")
];