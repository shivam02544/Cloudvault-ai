---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Backend — Add DELETE and GET URL Lambdas

## Objective
Implement the two new backend Lambda handlers dictated by Phase 4 decisions: soft-deletion of files and on-demand pre-signed URL generation for file previews and downloads.

## Context
- `.gsd/DECISIONS.md` Phase 4: Soft delete (`status = 'deleted'`) in DynamoDB, short expiry (5-10m) pre-signed URLs generated lazily.
- `backend/src/functions/deleteFile.js` (to be created)
- `backend/src/functions/getFileUrl.js` (to be created)

## Tasks

<task type="auto">
  <name>Create deleteFile Lambda</name>
  <files>backend/src/functions/deleteFile.js</files>
  <action>
    Create `deleteFile.js` implementing a soft delete.
    - Extract `fileId` from `event.pathParameters` (e.g. `event.pathParameters.fileId`).
    - Use `UpdateCommand` with `@aws-sdk/lib-dynamodb`.
    - Key is `userId: 'usr_test_123'` and `fileId`.
    - Update expression sets `status = :deleted`.
    - Make sure to handle `try/catch` effectively (returning 200 on success, 400 on missing ID, 500 on failure) while attaching standard CORS headers.
  </action>
  <verify>File `backend/src/functions/deleteFile.js` exists and explicitly utilizes `UpdateCommand` to perform a soft delete.</verify>
  <done>Soft-delete handler established with appropriate validation and response structure.</done>
</task>

<task type="auto">
  <name>Create getFileUrl Lambda</name>
  <files>backend/src/functions/getFileUrl.js</files>
  <action>
    Create `getFileUrl.js` yielding on-demand pre-signed S3 READ URLs.
    - Extract `fileId` from `event.pathParameters`.
    - Query DynamoDB (`GetCommand` from `@aws-sdk/lib-dynamodb`) for `userId: 'usr_test_123'` and `fileId` to retrieve the `key`. Return 404 if not found or if `status === 'deleted'`.
    - Use `GetObjectCommand` from `@aws-sdk/client-s3` and `getSignedUrl` to generate a URL with a `expiresIn: 600` parameter (10 minutes).
    - Return `statusCode: 200` with `{ url }`.
  </action>
  <verify>File `backend/src/functions/getFileUrl.js` exists, queries DB for `key`, and signs a `GetObjectCommand`.</verify>
  <done>Pre-signed read URL generator implemented with 10 minute expiry.</done>
</task>

## Success Criteria
- [ ] `deleteFile.js` successfully implements a DynamoDB `status = 'deleted'` soft delete transition.
- [ ] `getFileUrl.js` gracefully fetches an S3 key via DB and provisions a read-only 600-second expiring URL.
- [ ] Proper HTTP errors returned natively in both handlers.
