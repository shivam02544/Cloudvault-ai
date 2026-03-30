---
phase: 5
plan: 2
wave: 1
---

# Plan 5.2: Security Audit & Build Verification

## Objective
Ensure the repository does not leak any sensitive information and verify the frontend builds successfully with the injected environment variables.

## Context
- .gitignore
- frontend/package.json

## Tasks

<task type="auto">
  <name>Verify .gitignore</name>
  <files>.gitignore</files>
  <action>
    Check `.gitignore` to ensure it ignores:
    - `.env`
    - `.env.*` (but NOT `!.env.example`)
    - `.aws-sam/`
    - `node_modules/`
    - `.gsd/`, `.agent/`, `.gemini/`
    Ensure GSD artifacts stay strictly local as per Phase 5 decisions.
    Update the file if it's missing any of these.
  </action>
  <verify>powershell -Command "Get-Content .gitignore | Select-String -Pattern '.env|.gsd|.aws-sam'"</verify>
  <done>`.gitignore` prevents accidental commit of secrets and planning files.</done>
</task>

<task type="auto">
  <name>Security Audit</name>
  <files></files>
  <action>
    Run a grep search across the codebase (e.g., using `Select-String` or Native Search tools) to ensure no AWS keys (`AKIA...`) or sensitive backend secrets are hardcoded anywhere inside `backend/` or `frontend/`. Also check `git status` to ensure no sensitive files are currently staged or untracked that shouldn't be.
  </action>
  <verify>powershell -Command "git status"</verify>
  <done>No hardcoded secrets found.</done>
</task>

<task type="auto">
  <name>Verify Frontend Build</name>
  <files>frontend/package.json</files>
  <action>
    Run `npm run build` inside the `frontend/` directory to ensure Vite correctly compiles the production bundle using the `.env` variable (`VITE_API_URL`) without errors.
  </action>
  <verify>powershell -Command "cd frontend; npm run build"</verify>
  <done>Frontend builds successfully with 0 errors.</done>
</task>

## Success Criteria
- [ ] Codebase is verified to contain no AWS secrets.
- [ ] `.gitignore` is comprehensive and safe.
- [ ] Frontend successfully produces a production build.
