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
- `GET /files` returns metadata + freshly generated pre-signed READ URLs (60-second expiry) per file.
- Reason: Keeps S3 private, industry-standard secure access, no public bucket needed.

### Constraints
- S3 Block Public Access remains ON. No public-read ACLs.
- Pre-signed read URLs generated server-side with `GetObjectCommand`.
- Use DynamoDB `Query` (not `Scan`) keyed on `userId`.
- Both new Lambdas added under the same `CloudVaultApi` HTTP API (ensures CORS consistency).

