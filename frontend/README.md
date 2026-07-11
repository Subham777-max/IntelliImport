# Frontend

This document describes the architecture, component hierarchy, state management patterns, routing, and service layer of the IntelliImport frontend application.

---

## Technology Stack

| Concern | Choice |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Routing | React Router DOM v7 |
| HTTP Client | Axios |
| Styling | Tailwind CSS v4 |
| CSV Parsing (client-side) | PapaParse |
| Deployment | Vercel |

---

## Project Structure

```
frontend/
├── index.html
├── vite.config.js
├── vercel.json                         # SPA rewrite rule for client-side routing
└── src/
    ├── main.jsx                        # Application bootstrap, provider tree
    ├── api/
    │   └── api.js                      # Axios instance with base URL and credentials
    ├── app/
    │   ├── App.jsx                     # Wraps the router provider
    │   ├── App.routes.jsx              # Route definitions with protected wrappers
    │   └── index.css                   # Global base styles
    ├── assets/                         # Static assets
    ├── features/
    │   ├── auth/
    │   │   ├── auth.context.jsx
    │   │   ├── Auth.context.provider.jsx
    │   │   ├── components/
    │   │   │   ├── AuthInput.jsx
    │   │   │   └── AuthButton.jsx
    │   │   ├── hooks/
    │   │   │   └── useAuth.jsx
    │   │   ├── pages/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── RegisterPage.jsx
    │   │   └── service/
    │   │       └── auth.service.js
    │   └── crm/
    │       ├── crm.context.jsx
    │       ├── CRM.context.provider.jsx
    │       ├── components/
    │       │   ├── CsvUploader.jsx
    │       │   └── CsvPreviewTable.jsx
    │       ├── hooks/
    │       │   └── useCRM.jsx
    │       ├── pages/
    │       │   ├── DashboardPage.jsx
    │       │   ├── ProjectPage.jsx
    │       │   └── ImportDetailPage.jsx
    │       └── service/
    │           └── crm.service.js
    ├── global/
    │   ├── components/
    │   │   ├── AppLayout.jsx
    │   │   ├── Buttons.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Navbar.jsx
    │   │   └── StatusBadge.jsx
    │   ├── context/
    │   │   └── ToastContext.jsx
    │   └── hooks/
    │       └── useToast.jsx
    └── utils/
        ├── ProtectedRoutes.jsx
        └── csvParser.js
```

---

## Application Architecture

The application uses a feature-based folder structure. Each feature owns its context, hooks, pages, components, and service layer. Shared infrastructure lives in `global/`.

```mermaid
flowchart TD
    A[main.jsx] --> B[ToastContext.Provider]
    B --> C[AuthContextProvider]
    C --> D[CRMContextProvider]
    D --> E[RouterProvider]
    E --> F["/ — Protected\nDashboardPage"]
    E --> G["/project/:id — Protected\nProjectPage"]
    E --> H["/import/:id — Protected\nImportDetailPage"]
    E --> I["/login\nLoginPage"]
    E --> J["/register\nRegisterPage"]
```

---

## Routing

Routes are defined in `App.routes.jsx` using `createBrowserRouter`.

| Path | Component | Protected |
|---|---|---|
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/` | `DashboardPage` | Yes |
| `/project/:projectId` | `ProjectPage` | Yes |
| `/import/:importId` | `ImportDetailPage` | Yes |

### Protected Route Guard

```mermaid
flowchart TD
    A[User navigates to protected route] --> B[ProtectedRoutes renders]
    B --> C[handleGetMe called\nGET /api/auth/me]
    C --> D{Response OK?}
    D -- Yes --> E[Render child component]
    D -- No --> F[navigate to /login]
```

The `vercel.json` catch-all rewrite ensures hard refreshes or direct URL access always serve `index.html`, allowing React Router to take over on the client.

---

## Context and State Management

### Provider Stack

```mermaid
flowchart TB
    subgraph ToastContext
        T1[state: toasts array]
        T2[showToast - message, type]
    end
    subgraph AuthContext
        A1["state: user, loading, error"]
        A2[handleLogin]
        A3[handleRegister]
        A4[handleLogout]
        A5[handleGetMe]
    end
    subgraph CRMContext
        C1["state: projects, selectedProject,\nimports, records, skippedRecords,\nimportStats, loading, error"]
        C2[handleGetProjects]
        C3[handleCreateProject]
        C4[handleDeleteProject]
        C5[handleImportCSV]
        C6[handleGetCRMRecords]
    end
    ToastContext --> AuthContext
    AuthContext --> CRMContext
```

### CRM Loading State Design

The `loading` object in CRMContext uses named boolean flags instead of a single boolean. This allows different sections of the UI to show independent loading states without blocking each other.

```javascript
loading: {
  projects: false,
  createProject: false,
  deleteProject: false,
  projectDetails: false,
  imports: false,
  importCSV: false,
  importDetails: false,
  records: false,
  skippedRecords: false,
  stats: false,
}
```

---

## Feature: Authentication

### Login and Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant Page
    participant useAuth
    participant authService
    participant API

    User->>Page: Submits login form
    Page->>useAuth: handleLogin(email, password)
    useAuth->>useAuth: setLoading(true)
    useAuth->>authService: login({ email, password })
    authService->>API: POST /auth/login
    API-->>authService: 200 + Set-Cookie JWT
    authService-->>useAuth: response.data
    useAuth->>useAuth: setUser(response.data)
    useAuth-->>Page: returns response
    Page->>Page: navigate to /
```

The same pattern applies to `handleRegister` and `handleLogout`. On logout, the server clears the HTTP-only cookie and the client sets `user` to `null`.

---

## Feature: CRM

### Dashboard Page Flow

```mermaid
flowchart TD
    A[DashboardPage mounts] --> B[hasFetched ref check]
    B --> C[handleGetProjects\nGET /api/crm/projects]
    C --> D{projects.length > 0?}
    D -- No --> E[EmptyState with Create button]
    D -- Yes --> F[Render ProjectCard grid]
    F --> G{User action}
    G -- Create --> H[Modal opens]
    H --> I[handleCreateProject\nPOST /api/crm/project]
    I --> J[navigate to /project/:id]
    G -- Delete icon --> K[Confirmation Modal]
    K --> L[handleDeleteProject\nDELETE /api/crm/project/:id]
    L --> M[setProjects filter update]
    G -- Open --> J
```

### Project Page State Machine

The `ProjectPage` component manages a `view` state that controls which panel is rendered. This acts as a client-side state machine.

```mermaid
stateDiagram-v2
    [*] --> overview : Page loads, data fetched
    overview --> upload : User clicks Upload CSV
    upload --> overview : User cancels
    upload --> preview : User selects a valid file\nclient-side parse succeeds
    preview --> overview : User cancels
    preview --> processing : User confirms\nPOST /api/crm/import begins
    processing --> overview : Import response received
```

### Import Sidebar and Record Filtering

The sidebar lists every CSV file previously uploaded to the project. The selected import drives which API call populates the records table on the right.

```mermaid
flowchart TD
    A{selectedImportId} -- null --> B[GET /api/crm/records/:projectId\nAll project records]
    A -- set --> C[GET /api/crm/imports/:importId/records\nImport-specific records]
    D{activeTab} -- skipped --> E[GET /api/crm/imports/:importId/skipped\nOnly when import is selected]
    D -- imported --> C
```

Pagination is handled locally via `recordsPage` and `skippedPage` state. The component detects whether more pages exist by checking if the returned array length equals the configured page limit.

---

## Service Layer

The service layer contains functions that make direct Axios calls. Error handling is done exclusively by the hook layer that wraps each call.

### Auth Service

| Function | Method | Endpoint |
|---|---|---|
| `login(payload)` | POST | `/auth/login` |
| `register(payload)` | POST | `/auth/register` |
| `logout()` | POST | `/auth/logout` |
| `getMe()` | GET | `/auth/me` |

### CRM Service

| Function | Method | Endpoint |
|---|---|---|
| `getProjects()` | GET | `/crm/projects` |
| `createProject(payload)` | POST | `/crm/project` |
| `getProject(projectId)` | GET | `/crm/project/:projectId` |
| `deleteProject(projectId)` | DELETE | `/crm/project/:projectId` |
| `getImportsByProject(projectId, params)` | GET | `/crm/projects/:projectId/imports` |
| `importCSV({ file, projectId })` | POST | `/crm/import` (multipart) |
| `getImport(importId)` | GET | `/crm/imports/:importId` |
| `getCRMRecordsByImport(importId, params)` | GET | `/crm/imports/:importId/records` |
| `getSkippedRecords(importId, params)` | GET | `/crm/imports/:importId/skipped` |
| `getImportStats(importId)` | GET | `/crm/imports/:importId/stats` |
| `getCRMRecords(projectId, params)` | GET | `/crm/records/:projectId` |

All paginated endpoints apply `page` and `limit` query parameters via the `withPaginationDefaults` helper.

---

## HTTP Client Configuration

The Axios instance in `api/api.js` is configured with:

- **Base URL**: `https://intelliimport.onrender.com/api`
- **withCredentials**: `true` — required so the browser sends and receives the HTTP-only JWT cookie across origins

---

## Global Components

| Component | Description |
|---|---|
| `AppLayout` | Wraps all authenticated pages. Renders `Navbar` and a content area. |
| `Navbar` | Top bar with the application name and a logout button. |
| `Modal` | Portal-based overlay. Accepts `isOpen`, `onClose`, `title`, and a `footer` slot. |
| `Btn` | Primary action button. The `loading` prop replaces content with a spinner. |
| `GhostBtn` | Secondary/outlined button variant. |
| `StatusBadge` | Coloured pill for import statuses: `processing`, `completed`, `failed`. |
| `EmptyState` | Placeholder with optional icon, title, subtitle, and action slot. |

---

## Toast Notification System

```mermaid
flowchart TD
    A[Component calls\nuseToast showToast] --> B[ToastContext adds\nnew toast to array]
    B --> C[Toast renders in\nfixed overlay position]
    C --> D[setTimeout 3000ms]
    D --> E[Toast removed\nfrom array]
```

---

## Client-Side CSV Preview

Before submitting to the server, the client parses the file using PapaParse to extract headers and a row preview. This populates the `CsvPreviewTable` component for user review. No data reaches the backend until the user explicitly clicks "Confirm & Import".

```mermaid
flowchart TD
    A[User selects file in CsvUploader] --> B[csvParser reads file\nPapaParse on client]
    B --> C{Parse successful\nand has headers?}
    C -- No --> D[showToast error\nstay on upload view]
    C -- Yes --> E[setCsvData\nsetView to preview]
    E --> F[CsvPreviewTable renders\nheaders and row preview]
    F --> G{User decision}
    G -- Cancel --> H[reset state\nsetView to overview]
    G -- Confirm --> I[POST /api/crm/import\nwith original File object]
```

---

## Local Development

```bash
cd frontend
npm install
npm run dev   # Vite dev server starts at http://localhost:5173
```

To point at a local backend instead of the production Render service, change the `baseURL` in `src/api/api.js` to `http://localhost:3000/api`.
