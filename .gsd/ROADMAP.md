# ROADMAP.md

> **Current Phase**: Phase 4
> **Milestone**: v1.0

## Must-Haves (from SPEC)
- [ ] Pre-signed URL upload pipeline
- [ ] S3 storage integration
- [x] DynamoDB metadata tracking
- [ ] Dashboard with glassmorphism/dark mode

## Phases

### Phase 1: Core Backend Infrastructure
**Status**: ✅ Completed
**Objective**: Finalize AWS SAM configuration, ensure API Gateway & Lambda are provisioned correctly, and test pre-signed URL generation.
**Requirements**: REQ-01, REQ-02

### Phase 2: Frontend Base & Upload Flow
**Status**: ✅ Completed
**Objective**: Build out the initial Tailwind UI (dark mode, glassmorphism) with the drag-and-drop `UploadDropzone.jsx` integrating directly with the pre-signed URL API.
**Requirements**: REQ-03, REQ-04

### Phase 3: Dashboard & Metadata Sync
**Status**: ✅ Completed
**Objective**: Implement DynamoDB record creation upon successful S3 upload, and build a file dashboard grid to visually list, preview, and manage uploaded files.
**Requirements**: REQ-05, REQ-06

### Phase 4: Polish, Actions, & Launch
**Status**: ⬜ Not Started
**Objective**: Add robust error handling, toast notifications, one-click actions (copy URL, delete), and responsive micro-animations to reach the premium UI/UX standard.
**Requirements**: REQ-07
