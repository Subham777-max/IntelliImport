import * as authService  from "../service/auth.service.js";
import { setToken } from "../utils/setToken.js";
import catchAsync from "../utils/catchAsync.js";
import { config } from "../config/config.js";

const sendResponse = (res, statusCode, success, message, data) => {
    res.status(statusCode).json({
        success,
        message,
        data,
    });
}

export const register = catchAsync(async (req, res) => {
    const user = await authService.registerUser(req.body);
    setToken(res, user);
    sendResponse(res, 201, true, "User registered successfully", {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
    });
});

export const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    setToken(res, user);
    sendResponse(res, 200, true, "User logged in successfully", {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
    });
});

export const getMe = catchAsync(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    sendResponse(res, 200, true, "User data retrieved successfully", {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
    });
});

export const logout = catchAsync(async (req, res) => {
    const isProduction = config.NODE_ENV === "production";
    res.clearCookie("token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "none",
        maxAge: 0
    });
    sendResponse(res, 200, true, "User logged out successfully", null);
});