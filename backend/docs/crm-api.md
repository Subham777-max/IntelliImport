# CRM API Documentation

## Overview

The CRM module handles project creation, CSV import processing, AI-assisted record normalization, and retrieval of imported and skipped data.

All CRM routes are mounted under:

```text
/api/crm
```

Most routes are protected by authentication and require a valid user session or JWT cookie, depending on how the backend is configured.

## Core Features

### 1. Project Management
- Create CRM projects.
- List all projects created by the authenticated user.
- Retrieve a single project by ID.

### 2. CSV Import Processing
- Upload a CSV file for a project.
- Parse the CSV file into rows.
- Split rows into batches of 100.
- Send each batch to the AI processing layer.
- Store imported CRM records in MongoDB.
- Store rejected rows as skipped records with a reason.
- Track import progress and completion status.

### 3. CRM Record Retrieval
- List imported CRM records for a project.
- List imported CRM records for a specific import.
- List skipped records for a specific import.
- Retrieve import metadata and summary stats.

### 4. Validation
- Request payloads are validated with `express-validator`.
- Invalid request data returns a validation error response through the shared validation middleware.

## Common Response Format

Most successful CRM endpoints return a JSON response in this format:

```json
{
  "success": true,
  "...": "..."
}
```

Validation errors are handled by the backend validation middleware and returned as structured error responses.

## Route Reference

### 1. Create Project

**Method:** `POST`

**Path:** `/api/crm/project`

**Auth:** Required

**Validation:** `createProjectValidation`

**Expected input:**

```json
{
  "name": "Enterprise Leads"
}
```

**Rules:**
- `name` is required.
- `name` must be between 2 and 100 characters.

**Success response:**

```json
{
  "success": true,
  "project": {
    "_id": "66a1b2c3d4e5f67890123456",
    "title": "Enterprise Leads",
    "createdBy": "66a1b2c3d4e5f67890123400",
    "createdAt": "2026-07-10T12:00:00.000Z"
  }
}
```

**Typical errors:**
- `400` validation error if `name` is missing or invalid.
- `401` or `403` if the user is not authenticated.

---

### 2. Get All Projects

**Method:** `GET`

**Path:** `/api/crm/projects`

**Auth:** Required

**Expected input:** None

**Success response:**

```json
{
  "success": true,
  "projects": [
    {
      "_id": "66a1b2c3d4e5f67890123456",
      "title": "Enterprise Leads",
      "createdBy": "66a1b2c3d4e5f67890123400",
      "createdAt": "2026-07-10T12:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Returns projects for the authenticated user.
- Results are sorted by newest first.

---

### 3. Get Project by ID

**Method:** `GET`

**Path:** `/api/crm/project/:projectId`

**Auth:** Required

**Validation:** `projectIdValidation`

**Path parameters:**
- `projectId`: MongoDB ObjectId of the project.

**Success response:**

```json
{
  "success": true,
  "project": {
    "_id": "66a1b2c3d4e5f67890123456",
    "title": "Enterprise Leads",
    "createdBy": "66a1b2c3d4e5f67890123400",
    "createdAt": "2026-07-10T12:00:00.000Z"
  }
}
```

**Typical errors:**
- `400` validation error if `projectId` is not a valid ObjectId.
- `404` if the project does not exist.
- `403` if the authenticated user does not own the project.

---

### 4. Get All Imports for a Project

**Method:** `GET`

**Path:** `/api/crm/projects/:projectId/imports`

**Auth:** Required

**Validation:** `projectIdValidation`, `paginationValidation`

**Query parameters:**
- `page` optional, default `1`.
- `limit` optional, default `20`.

**Success response:**

```json
{
  "success": true,
  "imports": [
    {
      "_id": "66a1b2c3d4e5f67890123477",
      "projectId": "66a1b2c3d4e5f67890123456",
      "fileName": "leads.csv",
      "status": "completed",
      "totalRows": 200,
      "importedRows": 188,
      "skippedRows": 12,
      "createdAt": "2026-07-10T12:10:00.000Z"
    }
  ]
}
```

**Notes:**
- The backend checks that the project exists.
- The backend checks that the authenticated user owns the project before returning its imports.

**Typical errors:**
- `400` validation error for invalid `projectId`, `page`, or `limit`.
- `404` if the project does not exist.
- `403` if the authenticated user does not own the project.

---

### 5. Import CSV

**Method:** `POST`

**Path:** `/api/crm/import`

**Auth:** Required

**Validation:** `importCSVValidation`

**Content-Type:** `multipart/form-data`

**Expected form fields:**
- `projectId` required, MongoDB ObjectId.
- `file` required, CSV file upload.

**Success response:**

```json
{
  "success": true,
  "importId": "66a1b2c3d4e5f67890123477"
}
```

**Processing behavior:**
- The file is parsed with Papa Parse.
- Rows are split into batches of 100.
- Each batch is sent to the AI processing service.
- Imported records are written to the CRM collection.
- Skipped rows are written to the skipped records collection.
- Import progress is updated after each batch.
- The import is marked as `completed` after all batches finish.

**Typical errors:**
- `400` validation error if `projectId` is missing or invalid.
- `400` validation error if `file` is missing.
- `500` if the file cannot be parsed or the AI/import pipeline fails.

---

### 6. Get Import by ID

**Method:** `GET`

**Path:** `/api/crm/imports/:importId`

**Auth:** Required

**Validation:** `importIdValidation`

**Path parameters:**
- `importId`: MongoDB ObjectId of the import.

**Success response:**

```json
{
  "success": true,
  "importRecord": {
    "_id": "66a1b2c3d4e5f67890123477",
    "projectId": "66a1b2c3d4e5f67890123456",
    "fileName": "leads.csv",
    "status": "completed",
    "totalRows": 200,
    "importedRows": 188,
    "skippedRows": 12,
    "createdAt": "2026-07-10T12:10:00.000Z"
  }
}
```

**Typical errors:**
- `400` validation error if `importId` is not a valid ObjectId.
- `404` if the import does not exist.

---

### 7. Get Imported CRM Records for an Import

**Method:** `GET`

**Path:** `/api/crm/imports/:importId/records`

**Auth:** Required

**Validation:** `importIdValidation`, `paginationValidation`

**Query parameters:**
- `page` optional, default `1`.
- `limit` optional, default `50`.

**Success response:**

```json
{
  "success": true,
  "records": [
    {
      "_id": "66a1b2c3d4e5f67890123500",
      "importId": "66a1b2c3d4e5f67890123477",
      "projectId": "66a1b2c3d4e5f67890123456",
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Inc",
      "city": "New York"
    }
  ]
}
```

**Notes:**
- Returns CRM records linked to a specific import.
- Results are paginated.

**Typical errors:**
- `400` validation error for invalid `importId`, `page`, or `limit`.
- `404` if the import does not exist.

---

### 8. Get Skipped Records for an Import

**Method:** `GET`

**Path:** `/api/crm/imports/:importId/skipped`

**Auth:** Required

**Validation:** `importIdValidation`, `paginationValidation`

**Query parameters:**
- `page` optional, default `1`.
- `limit` optional, default `20`.

**Success response:**

```json
{
  "success": true,
  "skippedRecords": [
    {
      "_id": "66a1b2c3d4e5f67890123510",
      "importId": "66a1b2c3d4e5f67890123477",
      "projectId": "66a1b2c3d4e5f67890123456",
      "originalRecord": {
        "name": "Invalid Entry",
        "email": "not-an-email"
      },
      "reason": "Invalid email format"
    }
  ]
}
```

**Notes:**
- Returns rows rejected during AI or import processing.
- Results are paginated.

**Typical errors:**
- `400` validation error for invalid `importId`, `page`, or `limit`.
- `404` if the import does not exist.

---

### 9. Get Import Stats

**Method:** `GET`

**Path:** `/api/crm/imports/:importId/stats`

**Auth:** Required

**Validation:** `importIdValidation`

**Success response:**

```json
{
  "success": true,
  "stats": {
    "importRecord": {
      "_id": "66a1b2c3d4e5f67890123477",
      "projectId": "66a1b2c3d4e5f67890123456",
      "fileName": "leads.csv",
      "status": "completed",
      "totalRows": 200,
      "importedRows": 188,
      "skippedRows": 12,
      "createdAt": "2026-07-10T12:10:00.000Z"
    },
    "importedRows": 188,
    "skippedRows": 12
  }
}
```

**Notes:**
- This endpoint is useful for dashboards and import detail screens.
- It combines the import metadata with aggregate counts.

**Typical errors:**
- `400` validation error if `importId` is invalid.
- `404` if the import does not exist.

---

### 10. Get Project CRM Records

**Method:** `GET`

**Path:** `/api/crm/records/:projectId`

**Auth:** Required

**Validation:** `projectIdValidation`, `paginationValidation`

**Query parameters:**
- `page` optional, default `1`.
- `limit` optional, default `50`.

**Success response:**

```json
{
  "success": true,
  "records": [
    {
      "_id": "66a1b2c3d4e5f67890123500",
      "importId": "66a1b2c3d4e5f67890123477",
      "projectId": "66a1b2c3d4e5f67890123456",
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Inc"
    }
  ]
}
```

**Notes:**
- Returns all CRM records linked to a project.
- Results are paginated.

**Typical errors:**
- `400` validation error for invalid `projectId`, `page`, or `limit`.
- `404` if the project does not exist.

## CRM Data Models

### Project
- `title`: project name.
- `createdBy`: authenticated user ID.
- `createdAt`: timestamp.

### Import
- `projectId`: reference to the project.
- `fileName`: original uploaded file name.
- `status`: `processing`, `completed`, or `failed`.
- `totalRows`: total processed rows.
- `importedRows`: count of imported rows.
- `skippedRows`: count of skipped rows.
- `createdAt`: timestamp.

### CRM Record
- Stores normalized lead or contact fields such as `name`, `email`, `company`, `city`, `state`, `country`, and related CRM metadata.
- Includes `importId` and `projectId` references.

### Skipped Record
- Stores the original row that could not be imported.
- Includes a machine-readable or human-readable `reason` explaining why the row was skipped.

## Frontend Integration Notes

- Use `/api/crm/projects` to populate the project list.
- Use `/api/crm/project` to create a new project before uploading data.
- Use `/api/crm/import` to upload CSV files with `multipart/form-data`.
- Use `/api/crm/projects/:projectId/imports` to show a project import history screen.
- Use `/api/crm/imports/:importId/stats` for import detail dashboards.
- Use `/api/crm/imports/:importId/records` and `/api/crm/imports/:importId/skipped` to render import result tabs.
- Use `/api/crm/records/:projectId` when you need the consolidated CRM list for a project.

## Error Handling

The backend uses a shared validation middleware and error middleware. Common failure cases include:
- Missing authentication.
- Invalid MongoDB ObjectIds.
- Missing required request fields.
- Missing CSV file upload.
- Access denied when the authenticated user does not own the requested project.

## Summary

The CRM backend supports the full lifecycle of project creation, CSV ingestion, AI-driven record processing, skipped row tracking, and paginated result retrieval. The frontend can use the routes above to build project dashboards, import screens, and record review views.
