import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import PublicFilePage from './pages/PublicFilePage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Toast from './components/Toast.jsx';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-6">
          <div className="glass p-8 rounded-2xl max-w-sm w-full text-center border border-rose-500/20">
            <div className="h-12 w-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-white font-bold mb-2">Something went wrong</h2>
            <p className="text-slate-500 text-sm mb-5">An unexpected error occurred. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/s/:sharingId" element={<PublicFilePage />} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <App />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toast />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
