---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Environment Variables Setup

## Objective
Set up environment variables for the frontend and remove hardcoded API URLs to ensure the application is configured safely for production and public GitHub visibility.

## Context
- .gsd/SPEC.md
- frontend/.env
- frontend/src/App.jsx
- frontend/src/components/UploadDropzone.jsx

## Tasks

<task type="auto">
  <name>Create .env.example</name>
  <files>frontend/.env.example</files>
  <action>
    Create a new file `frontend/.env.example` with the following content:
    ```env
    VITE_API_URL=
    ```
    This serves as a template so other developers know what environment variables to provide.
  </action>
  <verify>powershell -Command "Get-Content frontend/.env.example"</verify>
  <done>File is created and contains correct dummy variable.</done>
</task>

<task type="auto">
  <name>Refactor Hardcoded API URLs</name>
  <files>
    frontend/src/App.jsx
    frontend/src/components/UploadDropzone.jsx
  </files>
  <action>
    Find where `API_URL` is defined in both files:
    `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';`
    Update both to strictly require the env variable:
    ```javascript
    const API_URL = import.meta.env.VITE_API_URL;
    if (!API_URL) {
      console.warn("VITE_API_URL is missing. API calls will fail.");
    }
    ```
    This ensures that it fails fast and visibly if the `.env` is unconfigured, avoiding silent fallbacks in production.
  </action>
  <verify>powershell -Command "Select-String -Path frontend/src/App.jsx -Pattern 'VITE_API_URL'"</verify>
  <done>Hardcoded `http://localhost:3000` is removed and it strictly relies on the `.env` configuration.</done>
</task>

## Success Criteria
- [ ] `frontend/.env.example` exists.
- [ ] API calls rely strictly on `.env` variables via `import.meta.env`.
