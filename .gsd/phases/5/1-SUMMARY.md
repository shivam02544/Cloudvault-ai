# Plan 5.1 Summary

**Objective:** Set up environment variables for the frontend and remove hardcoded API URLs.

**Completed Tasks:**
- `Create .env.example`: Created `frontend/.env.example` defining `VITE_API_URL`.
- `Refactor Hardcoded API URLs`: Updated `App.jsx` and `UploadDropzone.jsx` to strictly use `import.meta.env.VITE_API_URL` without falling back to localhost, logging a warning if missing.

**Verification:**
- Confirmed `VITE_API_URL` is parsed safely and no generic hardcodes exist.
