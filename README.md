# IntelliImport

IntelliImport is a full-stack AI-powered CRM lead import platform. It allows users to upload raw CSV files containing unstructured lead data and have them automatically normalised, structured, and stored as clean CRM records using a large language model. Records that cannot be reliably mapped are captured separately as skipped entries with an AI-provided reason.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [End-to-End Data Flow](#end-to-end-data-flow)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Deployment](#deployment)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Overview

The primary problem this application solves is the manual effort required to clean and standardise lead data from disparate CSV sources before it can be used in a CRM system. IntelliImport removes that effort by passing each batch of rows to a Mistral AI model with a structured output schema, which maps arbitrary column names and formats into a consistent CRM record shape.

The application is organised into two separately deployable services:

- **Backend** — A Node.js + Express API deployed on Render
- **Frontend** — A React + Vite SPA deployed on Vercel

---

## System Architecture

```
                           ┌─────────────────────────────┐
                           │         Browser              │
                           │   React SPA (Vercel)         │
                           └──────────────┬───────────────┘
                                          │ HTTPS + HTTP-only Cookie
                                          │ (Axios, withCredentials)
                                          │
                           ┌──────────────▼───────────────┐
                           │   Express API (Render)        │
                           │                              │
                           │  ┌──────────┐ ┌──────────┐  │
                           │  │  /auth   │ │  /crm    │  │
                           │  └────┬─────┘ └────┬─────┘  │
                           │       │             │        │
                           │  ┌────▼─────────────▼─────┐ │
                           │  │   Service / DAO Layer   │ │
                           │  └────┬──────────────┬─────┘ │
                           │       │              │        │
                           └───────┼──────────────┼────────┘
                                   │              │
                    ┌──────────────▼──┐     ┌─────▼──────────────┐
                    │    MongoDB       │     │   Mistral AI API    │
                    │  (Atlas/Cloud)   │     │  (LangChain SDK)    │
                    └─────────────────┘     └────────────────────┘
```

---

## Repository Structure

```
IntelliImport/
├── backend/          # Express API service
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── config/
│       ├── controllers/
│       ├── dao/
│       ├── llm/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── service/
│       ├── utils/
│       └── validation/
└── frontend/         # React SPA
    ├── index.html
    ├── vite.config.js
    ├── vercel.json
    └── src/
        ├── api/
        ├── app/
        ├── features/
        │   ├── auth/
        │   └── crm/
        ├── global/
        └── utils/
```

For full details on each service, refer to:
- [backend/README.md](./backend/README.md)
- [frontend/README.md](./frontend/README.md)

---

## End-to-End Data Flow

The following diagram traces a complete user session from login through to viewing processed CRM records.

```
1. User navigates to the app
         |
         v
   ProtectedRoutes checks session
   GET /api/auth/me
         |
   ┌─────┴──────┐
 no token      valid token
   |               |
   v               v
 /login        Dashboard loads
                   |
                   v
   GET /api/crm/projects
   (list all projects for this user)
         |
         v
2. User creates a new project
   POST /api/crm/project { name }
   ─────────────────────────────
   MongoDB: Project document created
   navigate to /project/:projectId
         |
         v
3. User uploads a CSV file
   ────────────────────────────────────────────────────────
   Client:   PapaParse reads file → preview table renders
   User:     reviews columns and confirms
   Client:   POST /api/crm/import (multipart/form-data)
             file buffer + projectId
   ────────────────────────────────────────────────────────
   Server:
     a. Import document created  (status: processing)
     b. CSV parsed into row array
     c. Rows split into batches of 100
     d. For each batch:
         ┌─────────────────────────────────────┐
         │  Mistral AI (mistral-small-latest)  │
         │  Temperature: 0                     │
         │  System prompt: CRM rules           │
         │  Output: { imported[], skipped[] }  │
         └─────────────────────────────────────┘
         ├── crmModel.insertMany(imported)
         ├── skippedModel.insertMany(skipped)
         └── Import.importedRows / skippedRows incremented
     e. Import document updated  (status: completed)
   ────────────────────────────────────────────────────────
   Response: { success: true, importId }
         |
         v
4. User views results
   ─────────────────────────────────────────────────────
   Imported tab:   GET /api/crm/imports/:importId/records
   Skipped tab:    GET /api/crm/imports/:importId/skipped
   All records:    GET /api/crm/records/:projectId
   ─────────────────────────────────────────────────────
```

---

## Core Features

### Project Management

Users can organise their imports into named projects. Each project is isolated per user. Projects can be created, browsed, and deleted. Deletion cascades through all associated imports, CRM records, and skipped records.

### AI-Powered CSV Import

Raw CSV files with arbitrary columns are uploaded and processed by the Mistral AI model. The model:

- Maps column values to a fixed CRM record schema
- Enforces a controlled vocabulary for `crm_status` and `data_source`
- Routes multiple emails or phone numbers into `crm_note`
- Skips rows that contain neither an email nor a phone number
- Provides a human-readable reason for each skipped row

The AI output is validated against a Zod schema via LangChain's structured output mode before any data is written to the database.

### Import History and Filtering

Each project maintains a history of every CSV file that was imported. Within the project view, users can select any previous import from a sidebar to filter the records table to that specific file, or select "All Records" to see the full project dataset.

### Paginated Record Viewing

CRM records and skipped records are paginated server-side. The frontend tracks the current page independently for imported and skipped views. Scroll-free, inline data tables display all CRM fields with double-click to expand truncated cells.

### Authentication

Session management uses JWT tokens stored in HTTP-only, SameSite cookies, which are invisible to JavaScript and not accessible to XSS attacks. CORS is configured with an explicit origin allowlist and `credentials: true`.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 |
| Frontend build | Vite 8 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 |
| HTTP client | Axios |
| Backend framework | Express 5 |
| Runtime | Node.js (ES Modules) |
| Database | MongoDB with Mongoose |
| AI model | Mistral AI (`mistral-small-latest`) |
| LLM SDK | LangChain (`@langchain/mistralai`, `@langchain/core`) |
| Schema validation | Zod |
| Input validation | express-validator |
| CSV parsing | PapaParse (both client and server) |
| Authentication | JWT + bcryptjs |
| File uploads | Multer (in-memory) |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Database hosting | MongoDB Atlas |

---

## Deployment

### Frontend (Vercel)

The frontend is deployed as a static SPA on Vercel. The `vercel.json` file contains a catch-all rewrite rule that redirects all routes to `index.html`, enabling React Router to handle navigation client-side after a page reload or direct URL access.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Live URL: `https://intelli-import.vercel.app`

### Backend (Render)

The backend is deployed as a web service on Render. The CORS configuration permits cross-origin requests with credentials from the Vercel frontend origin.

Live URL: `https://intelliimport.onrender.com`

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A MongoDB Atlas cluster (or local MongoDB instance)
- A Mistral AI API key

### Running the Backend

```bash
cd backend
npm install

# Create .env with the required variables (see below)

npm run dev
# Server starts at http://localhost:3000
```

### Running the Frontend

```bash
cd frontend
npm install

# To point at the local backend instead of production,
# update baseURL in src/api/api.js to http://localhost:3000/api

npm run dev
# Vite dev server starts at http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | Full MongoDB connection string, including database name |
| `JWT_SECRET` | Yes | A long, random secret string used to sign JWTs |
| `MISTRAL_API_KEY` | Yes | API key from the Mistral AI platform |
| `NODE_ENV` | No | `development` or `production` (defaults to `development`) |

The application will refuse to start if any required variable is missing.
