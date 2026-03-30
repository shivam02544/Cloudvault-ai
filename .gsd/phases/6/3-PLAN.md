---
phase: 6
plan: 3
wave: 2
---

# Plan 6.3: Frontend Auth Infrastructure

## Objective
Install the required frontend dependencies (`amazon-cognito-identity-js`, `react-router-dom`), create an `AuthContext` for managing auth state across the app, and update the API helper to automatically attach the `Authorization: Bearer <token>` header to all API calls.

## Context
- .gsd/phases/6/RESEARCH.md
- frontend/package.json
- frontend/src/main.jsx
- frontend/src/App.jsx
- frontend/.env
- frontend/.env.example

## Tasks

<task type="auto">
  <name>Install dependencies and update .env.example</name>
  <files>
    frontend/package.json
    frontend/.env.example
    frontend/.env
  </files>
  <action>
    Run the following command to install the two new packages:
    ```
    cmd.exe /c "npm install amazon-cognito-identity-js react-router-dom"
    ```
    Run this from the `frontend/` directory.

    Then update `frontend/.env.example` to:
    ```
    VITE_API_URL=
    VITE_COGNITO_USER_POOL_ID=
    VITE_COGNITO_CLIENT_ID=
    VITE_AWS_REGION=
    ```

    Also update `frontend/.env` to add the three new Cognito variable placeholders (leave them empty — values will be filled after `sam deploy`):
    ```
    VITE_API_URL=https://bhxgl43so6.execute-api.ap-south-1.amazonaws.com/
    VITE_COGNITO_USER_POOL_ID=
    VITE_COGNITO_CLIENT_ID=
    VITE_AWS_REGION=ap-south-1
    ```
  </action>
  <verify>powershell -Command "Select-String -Path frontend/package.json -Pattern 'amazon-cognito-identity-js'"</verify>
  <done>`amazon-cognito-identity-js` and `react-router-dom` appear in `package.json` dependencies.</done>
</task>

<task type="auto">
  <name>Create AuthContext</name>
  <files>frontend/src/context/AuthContext.jsx</files>
  <action>
    Create a new file `frontend/src/context/AuthContext.jsx` with the following content:

    ```jsx
    import React, { createContext, useContext, useState, useEffect } from 'react';
    import {
      CognitoUserPool,
      CognitoUser,
      AuthenticationDetails,
      CognitoUserAttribute,
    } from 'amazon-cognito-identity-js';

    const poolData = {
      UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    };

    const userPool = new CognitoUserPool(poolData);

    const AuthContext = createContext(null);

    export function AuthProvider({ children }) {
      const [user, setUser] = useState(null);
      const [token, setToken] = useState(() => localStorage.getItem('cv_token'));
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        // Restore session from localStorage on mount
        const currentUser = userPool.getCurrentUser();
        if (currentUser) {
          currentUser.getSession((err, session) => {
            if (!err && session.isValid()) {
              setUser(currentUser);
              setToken(session.getIdToken().getJwtToken());
              localStorage.setItem('cv_token', session.getIdToken().getJwtToken());
            }
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      }, []);

      const login = (email, password) =>
        new Promise((resolve, reject) => {
          const authDetails = new AuthenticationDetails({ Username: email, Password: password });
          const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
          cognitoUser.authenticateUser(authDetails, {
            onSuccess: (session) => {
              const jwt = session.getIdToken().getJwtToken();
              setUser(cognitoUser);
              setToken(jwt);
              localStorage.setItem('cv_token', jwt);
              resolve(session);
            },
            onFailure: reject,
          });
        });

      const signup = (email, password) =>
        new Promise((resolve, reject) => {
          const attributes = [
            new CognitoUserAttribute({ Name: 'email', Value: email }),
          ];
          userPool.signUp(email, password, attributes, null, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });

      const logout = () => {
        const currentUser = userPool.getCurrentUser();
        if (currentUser) currentUser.signOut();
        setUser(null);
        setToken(null);
        localStorage.removeItem('cv_token');
      };

      return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
          {children}
        </AuthContext.Provider>
      );
    }

    export function useAuth() {
      return useContext(AuthContext);
    }
    ```
  </action>
  <verify>powershell -Command "Test-Path frontend/src/context/AuthContext.jsx"</verify>
  <done>`AuthContext.jsx` exists and exports `AuthProvider` and `useAuth`.</done>
</task>

<task type="auto">
  <name>Update App.jsx API calls to attach Authorization header</name>
  <files>
    frontend/src/App.jsx
    frontend/src/components/UploadDropzone.jsx
  </files>
  <action>
    In `frontend/src/App.jsx`:
    1. Import `useAuth`: `import { useAuth } from './context/AuthContext';`
    2. Inside the `App` component, destructure token: `const { token } = useAuth();`
    3. Update every `axios` call to include the Authorization header:
       - `axios.get(...)` → `axios.get(..., { headers: { Authorization: \`Bearer ${token}\` } })`
       - `axios.delete(...)` → `axios.delete(..., { headers: { Authorization: \`Bearer ${token}\` } })`
    4. Update the `fetch` call for `GET /files` to:
       ```js
       const res = await fetch(`${API_URL}/files`, {
         headers: { Authorization: `Bearer ${token}` },
       });
       ```

    In `frontend/src/components/UploadDropzone.jsx`:
    1. Accept `token` as a prop: update the component signature to `function UploadDropzone({ onUploadSuccess, token })`
    2. Add Authorization header to both `axios.post` calls:
       ```js
       const res = await axios.post(`${API_URL}/files/upload-url`, {...}, {
         headers: { Authorization: `Bearer ${token}` },
         onUploadProgress: ...
       });
       ```
       and
       ```js
       await axios.post(`${API_URL}/files/confirm`, {...}, {
         headers: { Authorization: `Bearer ${token}` },
       });
       ```
    3. In `App.jsx`, update the `UploadDropzone` usage to pass the token: `<UploadDropzone onUploadSuccess={handleUploadSuccess} token={token} />`
  </action>
  <verify>powershell -Command "Select-String -Path frontend/src/App.jsx -Pattern 'Authorization'"</verify>
  <done>All API calls in `App.jsx` and `UploadDropzone.jsx` include the `Authorization: Bearer` header.</done>
</task>

## Success Criteria
- [ ] `amazon-cognito-identity-js` and `react-router-dom` installed in `frontend/package.json`.
- [ ] `frontend/src/context/AuthContext.jsx` created with `login`, `signup`, `logout`, and `useAuth`.
- [ ] All API calls in `App.jsx` and `UploadDropzone.jsx` attach an `Authorization` header.
