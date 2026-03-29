# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
CloudVault AI is a developer-first file storage and delivery platform. It serves as a lightweight, cost-efficient alternative to services like AWS S3 or Cloudinary, designed as a foundational product for developers and users to store, manage, and serve files in their applications.

## Goals
1. Provide a robust, serverless backend to generate pre-signed URLs for direct-to-S3 secure file uploads.
2. Track file metadata systematically in DynamoDB.
3. Deliver a premium, modern SaaS-like frontend (dark mode, glassmorphism) for dashboard management and drag-and-drop file uploads.

## Non-Goals (Out of Scope)
- Advanced image processing or on-the-fly video transcoding (in v1.0).
- Complex multi-tenant RBAC policies beyond basic secure user uploads.

## Users
Developers and users looking to quickly store and retrieve files (images, PDFs, videos, documents) and obtain usable external URLs for those files.

## Constraints
- **Cost**: Must remain within AWS free tier during development, minimizing data transfer and compute.
- **Architecture**: Must use serverless architecture exclusively (AWS Lambda + S3 + DynamoDB).

## Success Criteria
- [ ] A user can upload a file from the UI using drag-and-drop.
- [ ] The file is stored securely in S3.
- [ ] A public or usable URL is generated for the file.
- [ ] The file and its metadata appear dynamically in a responsive dashboard grid.
- [ ] The user can copy the URL, delete the file, or preview it from the dashboard.
