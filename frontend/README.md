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
    │   ├── auth/                       # Everything authentication-related
    │   │   ├── auth.context.jsx        # AuthContext definition
    │   │   ├── Auth.context.provider.jsx
    │   │   ├── components/
    │   │   │   ├── AuthInput.jsx
    │   │   │   └── AuthButton.jsx
    │   │   ├── hooks/
    │   │   │   └── useAuth.jsx         # Auth actions + context access
    │   │   ├── pages/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── RegisterPage.jsx
    │   │   └── service/
    │   │       └── auth.service.js     # Axios calls for auth endpoints
    │   └── crm/                        # Everything CRM and import-related
    │       ├── crm.context.jsx         # CRMContext definition
    │       ├── CRM.context.provider.jsx
    │       ├── components/
    │       │   ├── CsvUploader.jsx     # Drag-and-drop / file picker
    │       │   └── CsvPreviewTable.jsx # Preview grid before confirm
    │       ├── hooks/
    │       │   └── useCRM.jsx          # All CRM actions + context access
    │       ├── pages/
    │       │   ├── DashboardPage.jsx   # Project listing and management
    │       │   ├── ProjectPage.jsx     # Per-project view with import sidebar
    │       │   └── ImportDetailPage.jsx
    │       └── service/
    │           └── crm.service.js      # Axios calls for CRM endpoints
    ├── global/
    │   ├── components/
    │   │   ├── AppLayout.jsx           # Navbar + page wrapper
    │   │   ├── Buttons.jsx             # Btn and GhostBtn primitives
    │   │   ├── EmptyState.jsx          # Reusable empty placeholder
    │   │   ├── Modal.jsx               # Accessible modal dialog
    │   │   ├── Navbar.jsx              # Top navigation bar
    │   │   └── StatusBadge.jsx         # Import status indicator
    │   ├── context/
    │   │   └── ToastContext.jsx        # Toast notification system
    │   └── hooks/
    │       └── useToast.jsx            # Hook to trigger toasts
    └── utils/
        ├── ProtectedRoutes.jsx         # Route guard using auth state
        └── csvParser.js               # Client-side CSV header extraction
```

---

## Application Architecture

The application uses a feature-based folder structure. Each feature (`auth`, `crm`) owns its context, hooks, pages, components, and service layer. Shared infrastructure (layout, modals, toasts) lives in `global/`.

```
main.jsx
  └── ToastContext.Provider
        └── AuthContextProvider
              └── CRMContextProvider
                    └── RouterProvider (App.routes.jsx)
                          ├── /login            LoginPage
                          ├── /register         RegisterPage
                          ├── / (protected)     DashboardPage
                          ├── /project/:id (protected)  ProjectPage
                          └── /import/:id (protected)   ImportDetailPage
```

---

## Provider and Context Tree

The application stacks three context providers to make state globally accessible across the tree.

```
ToastContext
  Provides: showToast(message, type)
  Consumed via: useToast() hook

AuthContext
  State: { user, loading, error }
  Actions (via useAuth hook):
    handleLogin, handleRegister, handleLogout, handleGetMe

CRMContext
  State: {
    projects, selectedProject,
    imports, selectedImport,
    records, skippedRecords,
    importStats, loading, error
  }
  Actions (via useCRM hook):
    handleGetProjects, handleCreateProject, handleDeleteProject,
    handleGetProject, handleGetImportsByProject,
    handleImportCSV, handleGetImport,
    handleGetCRMRecords, handleGetCRMRecordsByImport,
    handleGetSkippedRecords, handleGetImportStats
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

**Protected Route Guard**

`ProtectedRoutes.jsx` wraps any route that requires authentication. On mount it calls `handleGetMe` to verify the session cookie. If the response fails (no valid token), the user is redirected to `/login`.

```
User navigates to protected route
          |
          v
  ProtectedRoutes renders
          |
    handleGetMe()  ──►  GET /api/auth/me
          |
    ┌─────┴──────┐
  success       failure
    |               |
  render        navigate('/login')
  children
```

The `vercel.json` configuration rewrites all paths to `index.html`, ensuring client-side navigation works correctly after a hard refresh or direct URL access in production.

---

## Feature: Authentication

### State and Actions

`Auth.context.provider.jsx` initialises `user`, `loading`, and `error` state. The `useAuth` hook exposes both state values and action handlers to any consuming component.

### Login and Registration Flow

```
User submits LoginPage form
          |
          v
useAuth.handleLogin(email, password)
          |
          v
authService.login({ email, password })
    POST /api/auth/login  (Axios, withCredentials: true)
          |
          v
  On success: setUser(response.data)
             navigate('/')
  On failure: setError(error)
             display toast
```

The same pattern applies to `handleRegister` and `handleLogout`. The logout action calls `POST /api/auth/logout` to clear the server-side cookie, then sets `user` to `null` on the client.

---

## Feature: CRM

### CRM State

`CRM.context.provider.jsx` manages the loading flags as a named object to allow independent loading states per operation.

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

This design allows the UI to show skeleton loaders or spinners for individual sections without blocking the entire page.

### Dashboard Page Flow

```
DashboardPage mounts
      |
      v  (once, via hasFetched ref)
handleGetProjects()
      |
      v
GET /api/crm/projects
      |
      v
Renders project grid (ProjectCard)

User clicks "New Project"
      |
      v
Modal opens → user types name
      |
      v
handleCreateProject(name)
      |
      v
POST /api/crm/project
      |
      v
On success: navigate to /project/:newId

User clicks delete icon on a project card
      |
      v
Confirmation modal opens
      |
      v
handleDeleteProject(projectId)
      |
      v
DELETE /api/crm/project/:projectId
      |
      v
setProjects(prev => prev.filter(...))  (optimistic UI update)
```

### Project Page State Machine

The `ProjectPage` component manages a local `view` state that acts as a mini state machine controlling which panel is rendered.

```
                   ┌──────────┐
     setView()     │          │
┌──────────────────│ overview │◄────────────────────────┐
│                  │          │                         │
│                  └──────────┘                         │
│                       |                               │
│               User clicks "Upload CSV"                │
│                       |                               │
│                        v                              │
│                  ┌──────────┐                         │
│                  │  upload  │                         │
│                  └──────────┘                         │
│                       |                               │
│               User selects a file                     │
│                       |                               │
│                        v                              │
│                  ┌──────────┐                         │
│                  │ preview  │  ◄── User can Cancel ───┤
│                  └──────────┘                         │
│                       |                               │
│           User clicks "Confirm & Import"              │
│                       |                               │
│                        v                              │
│                 ┌────────────┐                        │
│                 │ processing │                        │
│                 └────────────┘                        │
│                       |                               │
│               POST /api/crm/import                    │
│               AI processes in batches                 │
│                       |                               │
└───────────────────────┘
(returns to overview after completion)
```

### Import Sidebar and Record Filtering

The sidebar on the left of the `ProjectPage` lists all CSV files uploaded to the project. Selecting a file filters the records panel on the right to show only records from that import. Selecting "All Records" shows the full project dataset.

The `selectedImportId` state drives which API call is made in the records panel effect:

```
selectedImportId = null   →   GET /api/crm/records/:projectId
selectedImportId = <id>   →   GET /api/crm/imports/:importId/records
                               GET /api/crm/imports/:importId/skipped  (when "Skipped" tab active)
```

Pagination is handled locally via `recordsPage` and `skippedPage` state variables. The component detects whether more pages exist by checking if the returned array length equals the configured limit.

---

## Service Layer

The service layer contains functions that make direct Axios calls. They do not handle errors; error handling is done by the hook layer that wraps each call in try/catch.

### Auth Service (`auth.service.js`)

| Function | Method | Endpoint |
|---|---|---|
| `login(payload)` | POST | `/auth/login` |
| `register(payload)` | POST | `/auth/register` |
| `logout()` | POST | `/auth/logout` |
| `getMe()` | GET | `/auth/me` |

### CRM Service (`crm.service.js`)

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

All paginated endpoints accept `page` and `limit` query parameters with sensible defaults applied by the `withPaginationDefaults` helper.

---

## HTTP Client Configuration

The Axios instance in `api/api.js` is configured with:

- **Base URL**: `https://intelliimport.onrender.com/api` (production backend on Render)
- **withCredentials**: `true` — required for the browser to send and receive HTTP-only cookies across origins

---

## Global Components

| Component | Description |
|---|---|
| `AppLayout` | Wraps all authenticated pages. Renders the `Navbar` and a content area below it. |
| `Navbar` | Top bar with the application name and a logout button. |
| `Modal` | A portal-based overlay dialog. Accepts `isOpen`, `onClose`, `title`, and a `footer` slot. |
| `Btn` | Primary action button. Accepts a `loading` prop that replaces content with a spinner. |
| `GhostBtn` | Secondary/outlined button variant. |
| `StatusBadge` | Renders a coloured pill for import statuses: `processing`, `completed`, `failed`. |
| `EmptyState` | Placeholder panel with an optional icon, title, subtitle, and action slot. |

---

## Toast Notification System

`ToastContext.jsx` manages a list of toast messages in state and renders them as a stacked list. Each toast auto-dismisses after 3 seconds. Any component can access `showToast(message, type)` via the `useToast` hook without needing to manage any local notification state.

```
useToast().showToast('Import completed!', 'success')
          |
          v
Adds { id, message, type } to toasts array
          |
          v
Toast renders in fixed overlay position
          |
    after 3 seconds
          |
          v
Toast removed from array
```

---

## Client-Side CSV Parsing

Before a file is submitted to the server, the client parses it using PapaParse (`csvParser.js`) to extract the column headers and a preview of the first rows. This allows the `CsvPreviewTable` component to render a read-only preview for user confirmation before any server-side AI processing begins. No data is sent to the backend until the user clicks "Confirm & Import".

---

## Local Development

```bash
cd frontend
npm install
npm run dev   # starts Vite dev server on http://localhost:5173
```

The Vite dev server proxies API requests to the production backend by default (as configured in `api.js`). To point at a local backend, change the `baseURL` in `src/api/api.js` to `http://localhost:3000/api`.
