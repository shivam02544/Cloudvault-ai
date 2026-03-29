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
