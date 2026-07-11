import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import ProtectedRoute from '../utils/ProtectedRoutes'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <ProtectedRoute><h1>hello world</h1></ProtectedRoute>
    },
    {
        path: '/login',
        element: <LoginPage />
    },
    {
        path: '/register',
        element: <RegisterPage />
    },
])