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

    if (!poolData.UserPoolId || !poolData.ClientId) {
      console.warn('Cognito env vars missing (VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID)');
    }

    const userPool = new CognitoUserPool(poolData);

    const AuthContext = createContext(null);

    // Token storage keys
    const ID_TOKEN_KEY = 'cv_id_token';
    const ACCESS_TOKEN_KEY = 'cv_access_token';

    export function AuthProvider({ children }) {
      const [user, setUser] = useState(null);
      // idToken is what we send to the API Gateway Cognito Authorizer
      const [idToken, setIdToken] = useState(() => localStorage.getItem(ID_TOKEN_KEY));
      const [loading, setLoading] = useState(true);

      const persistTokens = (session) => {
        const id = session.getIdToken().getJwtToken();
        const access = session.getAccessToken().getJwtToken();
        localStorage.setItem(ID_TOKEN_KEY, id);
        localStorage.setItem(ACCESS_TOKEN_KEY, access);
        setIdToken(id);
      };

      const clearTokens = () => {
        localStorage.removeItem(ID_TOKEN_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        setIdToken(null);
      };

      useEffect(() => {
        // Restore session from Cognito SDK (uses its own localStorage keys)
        const currentUser = userPool.getCurrentUser();
        if (currentUser) {
          currentUser.getSession((err, session) => {
            if (!err && session.isValid()) {
              setUser(currentUser);
              persistTokens(session);
            } else {
              clearTokens();
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
              setUser(cognitoUser);
              persistTokens(session);
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
        clearTokens();
      };

      return (
        // Expose idToken as `token` — this is what the API Authorization header uses
        <AuthContext.Provider value={{ user, token: idToken, loading, login, signup, logout }}>
          {children}
        </AuthContext.Provider>
      );
    }

    export function useAuth() {
      return useContext(AuthContext);
    }
    ```

    Key tokens:
    - `cv_id_token` — the Cognito ID token, passed as `Authorization: Bearer <idToken>` to API Gateway
    - `cv_access_token` — stored for completeness (future use with Cognito-protected resources)
    - The `token` alias in context value always refers to `idToken` to keep API call code simple
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
- [ ] `frontend/src/context/AuthContext.jsx` stores both `cv_id_token` and `cv_access_token` in localStorage.
- [ ] `useAuth()` exposes `token` as the idToken — used for `Authorization: Bearer <idToken>` on all API calls.
- [ ] All API calls in `App.jsx` and `UploadDropzone.jsx` attach the `Authorization` header.
