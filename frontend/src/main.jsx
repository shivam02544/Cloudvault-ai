import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import Toast from './components/Toast.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
      <Toast />
    </ToastProvider>
  </StrictMode>,
)
