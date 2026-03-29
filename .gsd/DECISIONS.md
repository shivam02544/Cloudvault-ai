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
