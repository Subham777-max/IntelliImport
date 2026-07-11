import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import ProtectedRoute from '../utils/ProtectedRoutes'
import DashboardPage from '../features/crm/pages/DashboardPage'
import ProjectPage from '../features/crm/pages/ProjectPage'
import ImportDetailPage from '../features/crm/pages/ImportDetailPage'

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <DashboardPage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/project/:projectId',
        element: (
            <ProtectedRoute>
                <ProjectPage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/import/:importId',
        element: (
            <ProtectedRoute>
                <ImportDetailPage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/register',
        element: <RegisterPage />,
    },
])