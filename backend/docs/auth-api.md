# Authentication API Documentation

## Overview

The authentication module handles user registration, login, session retrieval, and logout.

All auth routes are mounted under:

```text
/api/auth
```

The backend uses cookie-based authentication. On successful login or registration, the server sets an HTTP-only `token` cookie.

## Core Features

### 1. User Registration
- Create a new user account.
- Automatically authenticate the user after successful registration.
- Set the auth token cookie.

### 2. User Login
- Authenticate an existing user.
- Set the auth token cookie.

### 3. Session Retrieval
- Return the currently authenticated user's profile data.

### 4. Logout
- Clear the auth token cookie.
- End the current authenticated session.

### 5. Validation
- Input data is validated with `express-validator`.
- Invalid input returns a validation error response through the shared validation middleware.

## Common Response Format

Auth endpoints return JSON responses in the following structure:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

For logout, `data` is `null`.

## Route Reference

### 1. Register User

**Method:** `POST`

**Path:** `/api/auth/register`

**Auth:** Public

**Validation:** `registerValidation`

**Expected input:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass@123"
}
```

**Rules:**
- `fullName` is required.
- `email` must be a valid email address.
- `password` is required.
- `password` must be 8 to 32 characters long.
- `password` must include at least one uppercase letter, one lowercase letter, one number, and one special character from `@$!%*?&`.
- `password` must not contain spaces.

**Success response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "66a1b2c3d4e5f67890123400",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Side effects:**
- Sets an HTTP-only `token` cookie.

**Typical errors:**
- `400` validation error if the payload is invalid.
- `409` or `400` depending on service-level duplicate user handling.

---

### 2. Login User

**Method:** `POST`

**Path:** `/api/auth/login`

**Auth:** Public

**Validation:** `loginValidation`

**Expected input:**

```json
{
  "email": "john@example.com",
  "password": "StrongPass@123"
}
```

**Rules:**
- `email` must be a valid email address.
- `password` is required.

**Success response:**

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "id": "66a1b2c3d4e5f67890123400",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Side effects:**
- Sets an HTTP-only `token` cookie.

**Typical errors:**
- `400` validation error if the payload is invalid.
- `401` if the credentials are incorrect.

---

### 3. Get Current User

**Method:** `GET`

**Path:** `/api/auth/me`

**Auth:** Private

**Expected input:** None

**Success response:**

```json
{
  "success": true,
  "message": "User data retrieved successfully",
  "data": {
    "id": "66a1b2c3d4e5f67890123400",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Notes:**
- Uses the authenticated user ID from `req.user`.
- Requires a valid auth cookie or token accepted by the auth middleware.

**Typical errors:**
- `401` if the user is not authenticated.
- `404` if the user account no longer exists.

---

### 4. Logout User

**Method:** `POST`

**Path:** `/api/auth/logout`

**Auth:** Private

**Expected input:** None

**Success response:**

```json
{
  "success": true,
  "message": "User logged out successfully",
  "data": null
}
```

**Side effects:**
- Clears the HTTP-only `token` cookie.

**Typical errors:**
- `401` if the user is not authenticated.

## Validation Reference

### Register Validation
- `fullName`: required.
- `email`: valid email format.
- `password`: required, 8-32 characters, must include uppercase, lowercase, numeric, and special characters, and must not contain whitespace.

### Login Validation
- `email`: valid email format.
- `password`: required.

## Auth Middleware Behavior

Protected routes use the shared auth middleware. In this module, the following routes require authentication:
- `GET /api/auth/me`
- `POST /api/auth/logout`

The middleware is expected to populate `req.user` with the authenticated user context.

## Frontend Integration Notes

- Use `POST /api/auth/register` to create a new account and establish the session.
- Use `POST /api/auth/login` to authenticate returning users.
- Use `GET /api/auth/me` during app initialization to restore the logged-in user state.
- Use `POST /api/auth/logout` to end the session and clear client state.

## Summary

The authentication API provides a minimal cookie-based login flow with shared validation and a standard JSON response structure. The frontend should rely on the `message` and `data` fields for user-facing state and profile hydration.
