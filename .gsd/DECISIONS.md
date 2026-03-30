# DECISIONS.md

## Initial Architecture Decision
**Date:** 2026-03-30
### Scope
- Focusing strictly on pre-signed URL upload to S3 for developer use cases.
### Approach
- Chose: AWS Serverless (API Gateway -> Lambda -> S3 + DynamoDB) with React (Tailwind).
- Reason: Simplest and most cost-effective path to MVP.
### Constraints
- AWS Free tier constraint.

## Phase 2 Decisions
**Date:** 2026-03-30

### Scope
- Single-file upload ONLY for MVP 1.0 to keep API simple.
- Max file size: 2MB limit.
- Supported types: Images (jpg, png, webp) and PDF. Limit prevents large bandwidth costs.

### Approach
- Chose: Direct-to-S3 upload utilizing an interactive progress bar.
- Reason: Reinforces the premium SaaS feel and improves UX versus basic success/fail states. Uses Axios `onUploadProgress`.

### Constraints & Requirements
- UI/UX Guidelines: Dark mode default, Glassmorphism (`bg-white/10 backdrop-blur-md border border-white/20`), smooth hover/drag-over states. Clean error state UI.
- Safety Constraints: Pre-signed URLs only, avoid public S3 access configuration. Ensure backend `localhost:5173` CORS is handled.

## Phase 3 Decisions
**Date:** 2026-03-30

### Scope
- DynamoDB write via **API-triggered** approach: frontend calls `POST /files/confirm` after successful S3 upload.
- Dashboard data loaded via **`GET /files` endpoint** — DynamoDB Query by `userId`. Files must persist across page refreshes.
- `userId` remains hardcoded as `'usr_test_123'` for MVP.
- No strict backend file size limit enforced; frontend remains flexible. Soft guideline: avoid very large files during development.

### Metadata Schema (DynamoDB `CloudVaultFiles` table)
Fields stored per file:
- `fileId` (Range key)
- `userId` (Hash key)
- `key` (S3 object key)
- `filename` (original filename)
- `contentType` (MIME type)
- `size` (bytes)
- `uploadedAt` (ISO timestamp)
- `status` (`active`)

### Approach
- Chose: Two new Lambda functions — `confirmUpload` (`POST /files/confirm`) and `listFiles` (`GET /files`).
- `GET /files` returns **metadata + S3 `key` only** — pre-signed read URLs generated lazily (on demand, e.g., preview click), NOT eagerly for all files.
- Reason: Reduces unnecessary Lambda compute; avoids generating many unused expiring URLs; better scalability.

### Constraints
- S3 Block Public Access remains ON. No public-read ACLs.
- Pre-signed read URLs generated server-side on demand (`GetObjectCommand`), not on list.
- Use DynamoDB `Query` (not `Scan`) keyed on `userId`.
- Both new Lambdas added under the same `CloudVaultApi` HTTP API (ensures CORS consistency).
- `GET /files` called **once on mount only** — no polling, no repeated calls.

### Backend Validation & Error Handling
- `confirmUpload.js` must validate required fields: `fileId`, `key`, `filename`, `contentType`. Reject with 400 if any missing.
- Both Lambdas must have try/catch returning proper HTTP codes: 200 success, 400 bad request, 500 server error.

### Frontend Behaviour
- `POST /files/confirm` only called AFTER confirmed successful S3 PUT (not before, not on error).
- Confirm failure handled gracefully — show error, do not crash.
- `App.jsx` shows loading spinner while `GET /files` is in-flight on mount.
- Empty state shown when `files.length === 0` and not loading.

## Phase 4 Decisions
**Date:** 2026-03-30

### Scope
- **Pre-signed URL Strategy:** Hybrid approach. Short expiry (5-10m) URLs generated on-demand via `GET /files/{fileId}/url`.
- **Delete Strategy:** Soft delete (`status = 'deleted'`) in DynamoDB. Kept safe in S3, hidden from UI.
- **Toasts:** Build custom lightweight Tailwind toast (glassmorphism) to avoid explicit dependencies.
- **Actions Placement:** Hover overlay icons (Preview, Copy, Delete) on file cards with subtle fade-in.

### Approach
- Chose: Two new Lambdas — `DELETE /files/{fileId}` for soft delete, `GET /files/{fileId}/url` for generating the on-demand S3 pre-signed URL.
- Reason: Keeps the architecture lightweight, functional, SaaS-aligned. Keeps permissions strictly bounded (e.g. `DynamoDBWritePolicy` on the delete endpoint, `S3ReadPolicy` on the URL generator).

### Constraints
- S3 bucket block public access remains intact.
- Lazy URL generation only fetches when user previews or copies.
- Toasts correctly bound to success, copy events, delete events, and errors.

## Phase 5 Decisions
**Date:** 2026-03-30

### Scope
- Prepare repository for GitHub without pushing automatically.
- Create proper `.gitignore`.
- Add `.env.example` files for frontend.
- Ensure no sensitive data is committed.

### Approach
- Chose: Distinct Environment Management.
- Reason: Keeps clean boundaries. Frontend uses `.env` with `VITE_API_URL` and `.env.example`. Backend uses SAM environment variables in `template.yaml`, avoiding `.env`.

### Constraints
- Keep `.gsd/`, `.agent/`, and `.gemini/` entirely local to maintain a clean public repo.
- Ensure frontend explicitly uses `VITE_` prefix to avoid leaking backend secrets.
- Verify repo history without deep rewrite unless a leak is found.

## Phase 6 Decisions
**Date:** 2026-03-30

### Scope
- Implement User Authentication using AWS Cognito (User Pools).
- Add Cognito Authorizer to API Gateway to protect all backend endpoints.
- Extract `userId` from the JWT token claims to replace the hardcoded `usr_test_123`.
- Configure DynamoDB Data Isolation where each user only accesses their own data (`userId` as Partition Key).
- Build Frontend Authentication flows (Signup, Login, Logout) and protect Dashboard routes.
- Target live Vercel deployment only AFTER authentication is complete (in a subsequent phase).

### Approach
- Chose: Authentication First (Option A).
- Reason: Deploying without authentication exposes all backend APIs publicly, leading to potential AWS Free Tier cost risks and security vulnerabilities.

### Constraints
- JWT token to be stored in `localStorage` for the MVP frontend authentication.
- All secure API calls must pass `Authorization: Bearer <token>`.
 
## Phase 7 Decisions (Milestone v1.2)
**Date:** 2026-03-30
 
### Scope
- **Utility First:** Prioritize core product features (Preview, Sharing, Quotas) over AI integrations (Rekognition/Textract) to maximize user value and minimize AWS costs.
- **Enhanced Auth UX:** Implement a dedicated, high-quality 6-digit OTP component with auto-focus and paste support to resolve manual verification friction.
- **In-App Previews:** Provide native modal viewers for Images, PDFs, Videos, and Audio to keep users within the application flow.
- **Sharing System:** Implement a dedicated "Share" flow with public/private toggles and expiry metadata stored in DynamoDB.
- **S3 Storage Quotas:** Implement a 5GB per-user storage limit enforced both on the backend (`getUploadUrl`) and displayed on the frontend.
 
### Approach
- Chose: **Utility Route (Option B)**.
- Reason: AI features add significant cost and complexity while basic product "must-haves" like file previews and sharing are still missing. This prioritizes "Product-Market Fit" utility.
- Enforcement: Storage quotas will be checked during the pre-signed URL generation phase to prevent large uploads from even starting if the quota is exceeded.
 
### Constraints
- No AI services (Rekognition, etc.) to be used in this phase.
- Maintain glassmorphism design consistency across all new modals and inputs.

## Phase 10 Decisions (AI Intelligence & Admin Moderation)
**Date:** 2026-03-30

### Scope
- **AI Image Analysis**: Automated tagging and moderation using AWS Rekognition.
- **Smart Search**: Filtering files by filename OR AI-generated tags.
- **Tag UI System**: Badge displays on cards and full tag management (view/edit/delete) in Preview Modals.
- **NSFW Content Safety**: Frontend-only blurring and "Sensitive Content" overlays for flagged files.
- **Admin AI Moderation**: A dedicated global moderation console for admins to oversee and override AI flags.
- **Hybrid Trigger Strategy**: Automatic analysis for files < 5MB; manual trigger for larger/skipped files.

### Approach
- **Chose: Async Post-Upload Analysis**.
- **Reason**: Decoupling analysis from the critical upload path ensures high availability and performance. The `confirmUpload` function will invoke the `analyzeImage` Lambda asynchronously.
- **Data Schema**: Extend DynamoDB `CloudVaultFiles` with `tags` (string list), `moderationLabels` (object list), `analyzed` (boolean), and `moderationStatus` (SAFE/UNSAFE).
- **Search**: Update `listFiles.js` to perform DynamoDB filtering on tags and filename.

### Constraints
- **Cost Control**: 5MB hard limit for automatic AI processing. No re-analysis of already processed files.
- **UI/UX**: Strictly maintain glassmorphism (`backdrop-blur-2xl`, `bg-slate-900/60`).
- **Permissions**: `analyzeImage` Lambda needs `RekognitionReadPolicy` and `S3ReadPolicy`. Admin API remains protected by Cognito Groups.
- **Safety**: Do NOT block uploads for NSFW content; only apply UI-level blurring to preserve user data but protect the interface.

