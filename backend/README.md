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
| Logging | Morgan |

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
    │   └── validate.middleware.js
    ├── models/
    │   ├── user.model.js
    │   ├── project.model.js
    │   ├── import.model.js
    │   ├── crm.model.js
    │   └── skipped.model.js
    ├── routes/
    │   ├── auth.routes.js      # /api/auth/* routes
    │   └── crm.route.js        # /api/crm/* routes
    ├── service/
    │   ├── auth.service.js     # Business logic for authentication
    │   ├── ai.service.js       # Calls the Mistral LLM with structured output
    │   └── csv.service.js      # CSV parsing and batch splitting
    ├── utils/
    │   ├── catchAsync.js
    │   ├── setToken.js
    │   └── errors/
    │       ├── AppError.js
    │       ├── AuthError.js
    │       ├── NotFoundError.js
    │       └── ValidationError.js
    └── validation/
        ├── auth.validation.js
        └── crm.validation.js
```

---

## Architecture and Layering

The backend follows a strict, unidirectional layered architecture. Each layer has a single responsibility and only communicates with the layer directly below it.

```mermaid
flowchart TD
    A[HTTP Request] --> B[Middleware Layer\nCORS / Auth / Body / Validation / Morgan]
    B --> C[Controller Layer\nauth.controller / crm.controller]
    C --> D[Service Layer\nauth.service / ai.service / csv.service]
    C --> E[DAO Layer\ncrm.dao / user.dao]
    D --> E
    D --> F[LLM Layer\ncrm.prompt + crm.schema]
    F --> G[Mistral AI API]
    E --> H[(MongoDB)]
```

---

## Data Models

### Relationship Overview

```mermaid
erDiagram
    USER {
        string fullName
        string email
        string password
        boolean isActive
        date lastLoginAt
    }
    PROJECT {
        string title
        objectId createdBy
        date createdAt
    }
    IMPORT {
        objectId projectId
        string fileName
        string status
        number totalRows
        number importedRows
        number skippedRows
        date createdAt
    }
    CRMRECORD {
        objectId importId
        objectId projectId
        string name
        string email
        string country_code
        string mobile_without_country_code
        string company
        string city
        string state
        string country
        string lead_owner
        string crm_status
        string crm_note
        string data_source
        string possession_time
        string description
    }
    SKIPPEDRECORD {
        objectId importId
        objectId projectId
        object originalRecord
        string reason
    }

    USER ||--o{ PROJECT : "creates"
    PROJECT ||--o{ IMPORT : "has"
    IMPORT ||--o{ CRMRECORD : "produces"
    IMPORT ||--o{ SKIPPEDRECORD : "produces"
```

### User

| Field | Type | Notes |
|---|---|---|
| `fullName` | String | max 120 characters |
| `email` | String | unique, lowercase |
| `password` | String | bcrypt-hashed, never returned by default |
| `isActive` | Boolean | default `true` |
| `lastLoginAt` | Date | optional |

The `pre("save")` hook hashes the password automatically. The `comparePassword` method provides safe comparison using bcrypt.

### Import — Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> processing : Import document created
    processing --> processing : Batch saved to DB
    processing --> completed : All batches done
    processing --> failed : Unhandled error
```

### CRMRecord — `crm_status` Enum

| Value | Meaning |
|---|---|
| `GOOD_LEAD_FOLLOW_UP` | Qualified lead requiring follow-up |
| `DID_NOT_CONNECT` | Contact attempt made, no response |
| `BAD_LEAD` | Lead disqualified |
| `SALE_DONE` | Conversion completed |

---

## CSV Import Pipeline

This is the core workflow of the application. When a user uploads a CSV file, the following sequence executes synchronously within a single HTTP request.

```mermaid
flowchart TD
    A[POST /api/crm/import\nmultipart/form-data] --> B[Multer stores file\nas in-memory Buffer]
    B --> C[createImportRecord\nstatus: processing]
    C --> D[parseCSV\nPapaParse converts buffer to row array]
    D --> E[splitIntoBatches\n100 rows per batch]
    E --> F{For each batch}
    F --> G[processBatch\nSend to Mistral AI]
    G --> H[AI returns\nimported and skipped arrays]
    H --> I[saveCRMRecords\ninsertMany to CRMRecord and SkippedRecord]
    I --> J[updateImportProgress\n$inc importedRows skippedRows totalRows]
    J --> F
    F -- All batches done --> K[updateImportProgress\nstatus: completed]
    K --> L[Response: 200\n success: true, importId]
```

---

## LLM Integration

The AI layer uses LangChain with the `ChatMistralAI` adapter.

- **Model**: `mistral-small-latest`
- **Temperature**: `0` (deterministic output)
- **Output mode**: Structured output enforced via a Zod schema

```mermaid
flowchart LR
    A[Batch of CSV rows\nJSON array] --> B[SystemMessage\nSYSTEM_PROMPT]
    A --> C[HumanMessage\nProcess this batch]
    B --> D[ChatMistralAI\n.withStructuredOutput]
    C --> D
    D --> E{Zod validates\nBatchResponseSchema}
    E -- valid --> F["{ imported: CRMRecord[],\n  skipped: SkippedRecord[] }"]
    E -- invalid --> G[LangChain retries\nor throws]
```

The system prompt instructs the model to skip rows with no email and no phone, enforce a controlled vocabulary for status and data source values, and return only structured JSON.

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthMiddleware
    participant Controller
    participant Service
    participant DAO
    participant DB

    Note over Client,DB: Registration
    Client->>Controller: POST /api/auth/register
    Controller->>Service: registerUser(body)
    Service->>DAO: findUserByEmail(email)
    DAO->>DB: User.findOne
    DB-->>DAO: null
    DAO-->>Service: null
    Service->>DAO: createUser(userData)
    DAO->>DB: user.save()
    DB-->>DAO: User doc
    DAO-->>Service: User doc
    Service-->>Controller: User doc
    Controller->>Client: 201 + JWT cookie

    Note over Client,DB: Protected Route Access
    Client->>AuthMiddleware: GET /api/auth/me (cookie)
    AuthMiddleware->>AuthMiddleware: jwt.verify(token)
    AuthMiddleware->>Controller: req.user attached
    Controller->>Service: getMe(req.user.id)
    Service->>DAO: findUserById
    DAO->>DB: User.findById
    DB-->>Controller: User doc
    Controller->>Client: 200 + user data
```

---

## API Reference

### Authentication Routes — `/api/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user. Body: `fullName`, `email`, `password`. |
| `POST` | `/login` | Public | Login and receive a JWT cookie. Body: `email`, `password`. |
| `POST` | `/logout` | Private | Clears the JWT cookie. |
| `GET` | `/me` | Private | Returns the authenticated user profile. |

### CRM Routes — `/api/crm`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/projects` | Private | List all projects for the authenticated user. |
| `POST` | `/project` | Private | Create a new project. Body: `{ name }`. |
| `GET` | `/project/:projectId` | Private | Get a specific project. |
| `DELETE` | `/project/:projectId` | Private | Delete project and all its associated data. |
| `GET` | `/projects/:projectId/imports` | Private | List imports for a project. Supports `?page` and `?limit`. |
| `POST` | `/import` | Private | Upload and process a CSV file. Multipart: `file` + `projectId`. |
| `GET` | `/imports/:importId` | Private | Get a single import record. |
| `GET` | `/imports/:importId/records` | Private | Get paginated CRM records for an import. |
| `GET` | `/imports/:importId/skipped` | Private | Get paginated skipped records for an import. |
| `GET` | `/imports/:importId/stats` | Private | Get import statistics. |
| `GET` | `/records/:projectId` | Private | Get all CRM records across a project (paginated). |

### Health Check

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Returns service status and timestamp. |

---

## Error Handling

All errors flow through the centralised `error.middleware.js`.

```mermaid
flowchart TD
    A[Async Controller throws] --> B[catchAsync\ncatches rejected Promise]
    B --> C[next called with error object]
    C --> D{Is it operational?}
    D -- Yes --> E[Log nothing\nSend structured JSON response]
    D -- No --> F[console.error full stack\nSend 500 response]
    E --> G["{ success: false, status, message, errors }"]
    F --> G
```

### Custom Error Hierarchy

```mermaid
classDiagram
    class AppError {
        +string message
        +number statusCode
        +boolean isOperational
    }
    class AuthError {
        +statusCode = 401
    }
    class NotFoundError {
        +statusCode = 404
    }
    class ValidationError {
        +statusCode = 422
    }
    AppError <|-- AuthError
    AppError <|-- NotFoundError
    AppError <|-- ValidationError
```

---

## Cascading Deletion

Deleting a project triggers coordinated cleanup across all collections.

```mermaid
flowchart TD
    A[DELETE /api/crm/project/:projectId] --> B[getProjectById]
    B --> C{Project exists?}
    C -- No --> D[throw NotFoundError 404]
    C -- Yes --> E{Owned by requester?}
    E -- No --> F[throw AppError 403]
    E -- Yes --> G[deleteProject DAO]
    G --> H[importModel.deleteMany]
    G --> I[crmModel.deleteMany]
    G --> J[skippedModel.deleteMany]
    H --> K[projectModel.findByIdAndDelete]
    I --> K
    J --> K
    K --> L[200 OK]
```

---

## Environment Variables

The `config.js` module throws immediately on startup if any required variable is absent.

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

CORS is configured to allow requests from `http://localhost:5173` (Vite dev server) and the production Vercel domain.
