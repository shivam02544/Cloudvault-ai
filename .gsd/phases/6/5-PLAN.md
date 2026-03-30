---
phase: 6
plan: 5
wave: 3
---

# Plan 6.5: Frontend Routing, Route Protection & Navbar Logout

## Objective
Wire up `react-router-dom` to the app, create a `ProtectedRoute` that redirects unauthenticated users to `/login`, update `main.jsx` to wrap with `AuthProvider` and `BrowserRouter`, and add a logout button to the Navbar.

## Context
- .gsd/phases/6/RESEARCH.md
- frontend/src/main.jsx
- frontend/src/App.jsx
- frontend/src/components/Navbar.jsx
- frontend/src/pages/LoginPage.jsx
- frontend/src/pages/SignupPage.jsx
- frontend/src/context/AuthContext.jsx

## Tasks

<task type="auto">
  <name>Create ProtectedRoute and update main.jsx with BrowserRouter + AuthProvider</name>
  <files>
    frontend/src/components/ProtectedRoute.jsx
    frontend/src/main.jsx
  </files>
  <action>
    **Step 1 — Create `frontend/src/components/ProtectedRoute.jsx`:**
    ```jsx
    import React from 'react';
    import { Navigate } from 'react-router-dom';
    import { useAuth } from '../context/AuthContext';
    import { Loader2 } from 'lucide-react';

    export default function ProtectedRoute({ children }) {
      const { token, loading } = useAuth();

      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-animated">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
        );
      }

      if (!token) {
        return <Navigate to="/login" replace />;
      }

      return children;
    }
    ```

    **Step 2 — Update `frontend/src/main.jsx`:**
    Replace the existing content with:
    ```jsx
    import { StrictMode } from 'react';
    import { createRoot } from 'react-dom/client';
    import { BrowserRouter, Routes, Route } from 'react-router-dom';
    import './index.css';
    import App from './App.jsx';
    import LoginPage from './pages/LoginPage.jsx';
    import SignupPage from './pages/SignupPage.jsx';
    import ProtectedRoute from './components/ProtectedRoute.jsx';
    import { ToastProvider } from './context/ToastContext.jsx';
    import { AuthProvider } from './context/AuthContext.jsx';
    import Toast from './components/Toast.jsx';

    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
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
      </StrictMode>
    );
    ```

    Note: `AuthProvider` must wrap `ToastProvider` so that auth state is available to all children. `BrowserRouter` must be the outermost wrapper so that `useNavigate` in `AuthContext` works.
  </action>
  <verify>powershell -Command "Select-String -Path frontend/src/main.jsx -Pattern 'BrowserRouter'"</verify>
  <done>`BrowserRouter`, `AuthProvider`, and route definitions including `ProtectedRoute` exist in `main.jsx`.</done>
</task>

<task type="auto">
  <name>Update Navbar with logout button and user email display</name>
  <files>frontend/src/components/Navbar.jsx</files>
  <action>
    Update `frontend/src/components/Navbar.jsx` to use the auth context. Replace the existing static user avatar button with a functional logout button:

    1. Add import at the top: `import { useAuth } from '../context/AuthContext';`
    2. Inside `Navbar`, destructure: `const { logout, user } = useAuth();`
    3. Replace the static User icon button with:
    ```jsx
    <button
      id="navbar-logout"
      onClick={logout}
      title="Sign out"
      className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center border border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
    >
      <User className="h-5 w-5 text-white" />
    </button>
    ```
    Keep all other Navbar elements unchanged (logo, search bar, Bell, Settings buttons).
  </action>
  <verify>powershell -Command "Select-String -Path frontend/src/components/Navbar.jsx -Pattern 'logout'"</verify>
  <done>`Navbar.jsx` calls `logout` on the avatar button click.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Verify frontend builds and auth flow renders correctly</name>
  <files></files>
  <action>
    Run:
    ```
    cmd.exe /c "npm run build"
    ```
    from the `frontend/` directory. Check for 0 errors.

    Then run `npm run dev` and manually verify:
    - Navigating to `http://localhost:5173/` redirects to `/login`
    - The Login page renders with the CloudVault AI branding and email/password form
    - Navigating to `/signup` shows the Signup form
    - The glassmorphism styling matches the existing dashboard design
  </action>
  <verify>cmd.exe /c "npm run build" (exit code 0)</verify>
  <done>Build succeeds with 0 errors. Login and Signup pages render correctly and the protected route redirects unauthenticated users.</done>
</task>

## Success Criteria
- [ ] `ProtectedRoute.jsx` created — redirects to `/login` when no token exists.
- [ ] `main.jsx` updated with `BrowserRouter`, `AuthProvider`, and route definitions.
- [ ] `Navbar.jsx` has a functional logout button.
- [ ] Frontend builds with 0 errors.
