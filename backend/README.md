# Backend

This document describes the architecture, request lifecycle, data models, and API surface of the IntelliImport backend service.

---

## Technology Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose |
| Authentication | JSON Web Tokens stored in HTTP-only cookies |
| AI / LLM | Mistral AI via LangChain (`mistral-small-latest`) |
| CSV Parsing | PapaParse |
| Input Validation | express-validator + Zod (for structured LLM output) |
| Password Hashing | bcryptjs |
| File Uploads | Multer (in-memory storage) |
| Schema Validation | Zod |
| Logging | Morgan |
| Environment | dotenv |

---

## Project Structure

```
backend/
├── server.js                   # Entry point: starts HTTP server and connects to DB
└── src/
    ├── app.js                  # Express application: middleware and route registration
    ├── config/
    │   ├── config.js           # Reads and validates environment variables
    │   ├── db.js               # Mongoose connection
    │   └── multer.js           # Multer configuration (in-memory buffer)
    ├── controllers/
    │   ├── auth.controller.js  # Handles register, login, logout, getMe
    │   └── crm.controller.js   # Handles project CRUD and CSV import pipeline
    ├── dao/
    │   ├── crm.dao.js          # All database operations for CRM domain
    │   └── user.dao.js         # User lookup and creation
    ├── llm/
    │   ├── prompts/
    │   │   └── crm.prompt.js   # System prompt sent to the LLM
    │   └── schema/
    │       └── crm.schema.js   # Zod schema for structured LLM output
    ├── middleware/
    │   ├── auth.middleware.js  # JWT verification from cookies
    │   ├── error.middleware.js # Centralised error handler
    │   └── validate.middleware.js # Runs express-validator result checks
    ├── models/
    │   ├── user.model.js       # User schema with bcrypt hooks
    │   ├── project.model.js    # Project schema
    │   ├── import.model.js     # Import job schema with status tracking
    │   ├── crm.model.js        # Structured CRM record schema
    │   └── skipped.model.js    # Records rejected by the AI
    ├── routes/
    │   ├── auth.routes.js      # /api/auth/* routes
    │   └── crm.route.js        # /api/crm/* routes
    ├── service/
    │   ├── auth.service.js     # Business logic for authentication
    │   ├── ai.service.js       # Calls the Mistral LLM with structured output
    │   └── csv.service.js      # CSV parsing and batch splitting
    ├── utils/
    │   ├── catchAsync.js       # Wraps async handlers to forward errors
    │   ├── setToken.js         # Signs and sets the JWT cookie
    │   └── errors/
    │       ├── AppError.js
    │       ├── AuthError.js
    │       ├── NotFoundError.js
    │       └── ValidationError.js
    └── validation/
        ├── auth.validation.js  # express-validator rules for auth routes
        └── crm.validation.js   # express-validator rules for CRM routes
```

---

## Architecture and Layering

The backend follows a strict, unidirectional layered architecture. Each layer has a single responsibility and only interacts with the layer directly below it.

```
                    HTTP Request
                        |
                        v
             ┌─────────────────────┐
             │      Middleware      │
             │  (CORS, Auth, Body,  │
             │   Validation, Log)   │
             └─────────┬───────────┘
                       |
                       v
             ┌─────────────────────┐
             │      Controller      │
             │  (Request/Response)  │
             └────┬──────────┬─────┘
                  |          |
          ┌───────┘          └────────┐
          v                          v
 ┌─────────────────┐      ┌──────────────────┐
 │    Service       │      │   Service        │
 │ (auth.service)   │      │ (ai / csv svc)   │
 └────────┬────────┘      └────────┬─────────┘
          |                        |
          v                        v
 ┌─────────────────┐      ┌──────────────────┐
 │      DAO         │      │   LLM Layer      │
 │  (user.dao /     │      │ (crm.prompt +    │
 │   crm.dao)       │      │  crm.schema)     │
 └────────┬────────┘      └──────────────────┘
          |
          v
 ┌─────────────────┐
 │     MongoDB      │
 │    (Mongoose)    │
 └─────────────────┘
```

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| `fullName` | String | max 120 characters |
| `email` | String | unique, lowercase |
| `password` | String | bcrypt-hashed, never returned by default |
| `isActive` | Boolean | default `true` |
| `lastLoginAt` | Date | optional |

The `pre("save")` hook hashes the password automatically. The `comparePassword` method provides safe comparison using bcrypt.

### Project

| Field | Type | Notes |
|---|---|---|
| `title` | String | required |
| `createdBy` | ObjectId | ref: User |
| `createdAt` | Date | default: now |

### Import

Tracks the state of a single CSV file upload and its processing job.

| Field | Type | Notes |
|---|---|---|
| `projectId` | ObjectId | ref: Project |
| `fileName` | String | original file name |
| `status` | String | enum: `processing`, `completed`, `failed` |
| `totalRows` | Number | |
| `importedRows` | Number | rows accepted by the AI |
| `skippedRows` | Number | rows rejected by the AI |
| `createdAt` | Date | |

### CRMRecord

Stores a single structured lead record produced by the AI.

| Field | Type |
|---|---|
| `importId` | ObjectId |
| `projectId` | ObjectId |
| `name` | String |
| `email` | String |
| `country_code` | String |
| `mobile_without_country_code` | String |
| `company` | String |
| `city` | String |
| `state` | String |
| `country` | String |
| `lead_owner` | String |
| `crm_status` | String (enum) |
| `crm_note` | String |
| `data_source` | String |
| `possession_time` | String |
| `description` | String |
| `created_at` | String |

`crm_status` is constrained to: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`.

### SkippedRecord

Stores raw rows that the AI determined were invalid.

| Field | Type | Notes |
|---|---|---|
| `importId` | ObjectId | |
| `projectId` | ObjectId | |
| `originalRecord` | Object | the raw CSV row |
| `reason` | String | AI-provided explanation |

---

## CSV Import Pipeline

This is the core workflow of the application. When a user uploads a CSV file, the following sequence executes synchronously within a single HTTP request.

```
Client sends POST /api/crm/import (multipart/form-data)
        |
        v
Multer stores file in memory as Buffer
        |
        v
1. createImportRecord()
   Create an Import document with status: "processing"
        |
        v
2. parseCSV()
   PapaParse converts the raw buffer string
   into an array of row objects
        |
        v
3. splitIntoBatches()
   Rows are chunked into batches of 100
        |
        v
4. for each batch:
   ┌────────────────────────────────────────────────┐
   │                                                │
   │  processBatch()  ──►  Mistral AI               │
   │  (SYSTEM_PROMPT + batch JSON as HumanMessage)  │
   │                                                │
   │  AI returns structured output:                 │
   │  {                                             │
   │    imported: [CRMRecord, ...],                 │
   │    skipped:  [{ originalRecord, reason }, ...] │
   │  }                                             │
   │                                                │
   │  saveCRMRecords()                              │
   │    - insertMany into CRMRecord collection      │
   │    - insertMany into SkippedRecord collection  │
   │                                                │
   │  updateImportProgress()                        │
   │    - $inc importedRows, skippedRows, totalRows │
   │    - $set status: "processing"                 │
   └────────────────────────────────────────────────┘
        |
        v
5. updateImportProgress() with status: "completed"
        |
        v
Response: { success: true, importId }
```

---

## LLM Integration

The AI layer uses LangChain with the `ChatMistralAI` adapter.

**Model**: `mistral-small-latest`  
**Temperature**: `0` (deterministic, no hallucination)  
**Output mode**: Structured output enforced via a Zod schema

The system prompt instructs the model to:
- Skip rows that have neither an email nor a phone number
- Map data to a fixed set of CRM statuses
- Map data to a fixed set of data sources
- Place the first phone/email into primary fields and route additional ones into `crm_note`
- Return only structured data matching the `BatchResponseSchema`

The `BatchResponseSchema` (Zod) defines the exact shape the LLM must return. LangChain's `.withStructuredOutput()` enforces this contract, preventing malformed responses from reaching the database layer.

---

## Authentication Flow

```
Registration:
  POST /api/auth/register
    │
    ├── express-validator runs registerValidation rules
    ├── validate middleware checks for errors
    ├── authController.register()
    │     └── authService.registerUser()
    │           ├── findUserByEmail() – throws 409 if exists
    │           └── createUser()     – bcrypt hashes password via pre-save hook
    └── setToken() – signs JWT, sets HTTP-only cookie
        └── sendResponse() – returns user data (no password)

Login:
  POST /api/auth/login
    │
    ├── loginValidation + validate
    ├── authController.login()
    │     └── authService.loginUser()
    │           ├── findUserByEmail() – throws 401 if not found
    │           └── user.comparePassword() – bcrypt compare
    └── setToken() + sendResponse()

Protected Route Access:
  Any Private Route
    │
    ├── authMiddleware
    │     ├── reads req.cookies.token
    │     ├── jwt.verify(token, JWT_SECRET)
    │     └── attaches decoded payload to req.user
    └── Controller proceeds with req.user.id
```

---

## API Reference

### Authentication Routes (`/api/auth`)

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user. Accepts `fullName`, `email`, `password`. |
| `POST` | `/login` | Public | Login and receive a JWT cookie. Accepts `email`, `password`. |
| `POST` | `/logout` | Private | Clears the JWT cookie. |
| `GET` | `/me` | Private | Returns the authenticated user's profile. |

### CRM Routes (`/api/crm`)

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/projects` | Private | List all projects for the authenticated user. |
| `POST` | `/project` | Private | Create a new project. Body: `{ name }`. |
| `GET` | `/project/:projectId` | Private | Get a specific project. |
| `DELETE` | `/project/:projectId` | Private | Delete a project and all associated imports, CRM records, and skipped records. |
| `GET` | `/projects/:projectId/imports` | Private | List imports for a project. Supports `?page` and `?limit`. |
| `POST` | `/import` | Private | Upload and process a CSV file. Multipart form with `file` and `projectId`. |
| `GET` | `/imports/:importId` | Private | Get a single import record. |
| `GET` | `/imports/:importId/records` | Private | Get paginated CRM records for an import. |
| `GET` | `/imports/:importId/skipped` | Private | Get paginated skipped records for an import. |
| `GET` | `/imports/:importId/stats` | Private | Get import statistics (imported count, skipped count). |
| `GET` | `/records/:projectId` | Private | Get all CRM records across an entire project (paginated). |

### Health Check

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Returns service status and timestamp. |

---

## Error Handling

All errors flow through the centralised `error.middleware.js`. The middleware distinguishes between operational errors (expected, thrown explicitly via custom error classes) and programming errors (unexpected).

**Custom Error Hierarchy:**

```
AppError          (base – statusCode, isOperational = true)
├── AuthError     (401 Unauthorized)
├── NotFoundError (404 Not Found)
└── ValidationError
```

All controller functions are wrapped in `catchAsync`, which catches rejected promises and forwards them to `next(error)`, ensuring the global error handler always receives control.

---

## Cascading Deletion

Deleting a project triggers a coordinated cleanup. The `deleteProject` DAO function runs three `deleteMany` operations in parallel before removing the project document itself.

```
DELETE /api/crm/project/:projectId
  │
  ├── Verify project exists          (NotFoundError if not)
  ├── Verify ownership               (AppError 403 if not owner)
  └── deleteProject(projectId)
        ├── importModel.deleteMany({ projectId })
        ├── crmModel.deleteMany({ projectId })
        ├── skippedModel.deleteMany({ projectId })
        └── projectModel.findByIdAndDelete(projectId)
```

---

## Environment Variables

The `config.js` module reads these variables and throws immediately on startup if any are missing.

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `MISTRAL_API_KEY` | Yes | API key for the Mistral AI platform |
| `NODE_ENV` | No | `development` or `production` (default: `development`) |

---

## Local Development

```bash
cd backend
npm install
# Create a .env file with the variables listed above
npm run dev   # starts with nodemon on port 3000
```

The server listens on `http://localhost:3000`. CORS is configured to allow requests from `http://localhost:5173` (Vite dev server).
