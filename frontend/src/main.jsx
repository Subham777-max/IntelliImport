import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/index.css'
import App from './app/App.jsx'
import { AuthProvider } from './features/auth/Auth.context.provider.jsx'
import { ToastProvider } from './global/context/ToastContext.jsx'
import { CRMProvider } from './features/crm/CRM.context.provider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <CRMProvider>
          <App />
        </CRMProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
